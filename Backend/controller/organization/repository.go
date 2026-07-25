package organization

import (
	"backend/entity"
	"gorm.io/gorm"
)

// OrganizationRepository จัดการเกี่ยวกับการดึงและบันทึกข้อมูลองค์กรในฐานข้อมูล
type OrganizationRepository interface {
	GetOrganization() (*entity.Subdistrict, error)
	GetVillageByID(id uint) (*entity.Village, error)
	UpdateOrganizationInfo(subdistrictID uint, req *UpdateOrganizationRequest) error
}

type organizationRepository struct {
	db *gorm.DB
}

func NewOrganizationRepository(db *gorm.DB) OrganizationRepository {
	return &organizationRepository{db: db}
}

// GetOrganization ดึงข้อมูลตำบล พร้อมกับข้อมูลที่อยู่ (Village) และข้อมูลนายก (SubdistrictInfo)
func (r *organizationRepository) GetOrganization() (*entity.Subdistrict, error) {
	var subdistrict entity.Subdistrict
	// ดึงตำบลแรกสุดเสมอ (ระบบ Single-Org)
	err := r.db.
		Preload("District").
		Preload("District.Province").
		Preload("SubdistrictInfo").
		First(&subdistrict).Error
	if err != nil {
		return nil, err
	}
	return &subdistrict, nil
}

// GetVillageByID ดึงข้อมูลหมู่บ้านด้วย ID
func (r *organizationRepository) GetVillageByID(id uint) (*entity.Village, error) {
	var village entity.Village
	if err := r.db.First(&village, id).Error; err != nil {
		return nil, err
	}
	return &village, nil
}

// UpdateOrganizationInfo อัปเดตข้อมูลองค์กร โดยครอบด้วย Transaction
func (r *organizationRepository) UpdateOrganizationInfo(subdistrictID uint, req *UpdateOrganizationRequest) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. อัปเดตที่อยู่สำนักงานลงในตาราง Subdistrict
		var subdistrict entity.Subdistrict
		if err := tx.Preload("District").Preload("District.Province").First(&subdistrict, subdistrictID).Error; err != nil {
			return err
		}
		subdistrict.AddressNumber = req.AddressNumber
		subdistrict.VillageID = req.VillageID
		subdistrict.SubdistrictName = req.SubdistrictName
		if err := tx.Save(&subdistrict).Error; err != nil {
			return err
		}

		// 1.1 อัปเดตชื่ออำเภอและจังหวัด
		if subdistrict.District != nil {
			subdistrict.District.DistrictName = req.DistrictName
			if err := tx.Save(subdistrict.District).Error; err != nil {
				return err
			}
			if subdistrict.District.Province != nil {
				subdistrict.District.Province.ProvinceName = req.ProvinceName
				if err := tx.Save(subdistrict.District.Province).Error; err != nil {
					return err
				}
			}
		}

		// 2. อัปเดตหรือสร้างข้อมูลนายก ลงในตาราง SubdistrictInfo
		var existingInfo entity.SubdistrictInfo
		err := tx.Where("subdistrict_id = ?", subdistrictID).First(&existingInfo).Error

		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// กรณีที่ยังไม่มีข้อมูลนายกเลย ให้สร้างใหม่ (Create)
				newInfo := entity.SubdistrictInfo{
					SubdistrictID: subdistrictID,
					TitleName:     req.TitleName,
					FirstName:     req.FirstName,
					LastName:      req.LastName,
					PhoneNumber:   req.PhoneNumber,
				}
				return tx.Create(&newInfo).Error
			}
			return err
		}

		// กรณีที่มีข้อมูลอยู่แล้ว ให้อัปเดต (Update)
		existingInfo.TitleName = req.TitleName
		existingInfo.FirstName = req.FirstName
		existingInfo.LastName = req.LastName
		existingInfo.PhoneNumber = req.PhoneNumber

		return tx.Save(&existingInfo).Error
	})
}
