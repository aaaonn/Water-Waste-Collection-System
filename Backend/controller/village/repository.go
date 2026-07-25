package village

import (
	"backend/entity"
	"gorm.io/gorm"
)

// VillageRepository อินเตอร์เฟสสำหรับจัดการข้อมูล Village ใน Database
type VillageRepository interface {
	GetAll() ([]entity.Village, error)
	GetByID(id uint) (*entity.Village, error)
	GetByNumberAndSubdistrict(number int, subdistrictID uint) (*entity.Village, error)
	Create(v *entity.Village) error
	Update(v *entity.Village) error
	Delete(id uint) error
}

type villageRepository struct {
	db *gorm.DB
}

// NewVillageRepository สร้างอินสแตนซ์ของ Repository
func NewVillageRepository(db *gorm.DB) VillageRepository {
	return &villageRepository{db: db}
}

// GetAll ดึงรายชื่อหมู่บ้านทั้งหมด เรียงตามหมายเลขหมู่บ้าน
func (r *villageRepository) GetAll() ([]entity.Village, error) {
	var villages []entity.Village
	err := r.db.Preload("Subdistrict").Preload("VillageDetail").Order("village_number").Find(&villages).Error
	if err != nil {
		return nil, err
	}
	return villages, nil
}

// GetByID ดึงข้อมูลหมู่บ้านหนึ่งตัวตาม ID
func (r *villageRepository) GetByID(id uint) (*entity.Village, error) {
	var v entity.Village
	err := r.db.Preload("Subdistrict").Preload("VillageDetail").First(&v, id).Error
	if err != nil {
		return nil, err
	}
	return &v, nil
}

// GetByNumberAndSubdistrict ดึงข้อมูลหมู่บ้านตามเลขที่หมู่และไอดีตำบล เลขที่หมู่ไม่ซ้ำกันในตำบล
func (r *villageRepository) GetByNumberAndSubdistrict(number int, subdistrictID uint) (*entity.Village, error) {
	var v entity.Village
	err := r.db.Where("village_number = ? AND subdistrict_id = ?", number, subdistrictID).First(&v).Error
	if err != nil {
		return nil, err
	}
	return &v, nil
}

// Create บันทึกข้อมูลหมู่บ้านใหม่ลงฐานข้อมูล
func (r *villageRepository) Create(v *entity.Village) error {
	return r.db.Create(v).Error
}

// Update อัปเดตข้อมูลหมู่บ้านและรายละเอียดที่มีอยู่
func (r *villageRepository) Update(v *entity.Village) error {
	return r.db.Session(&gorm.Session{FullSaveAssociations: true}).Save(v).Error
}

// Delete ลบข้อมูลหมู่บ้านและรายละเอียดที่เกี่ยวข้อง (Soft Delete ผ่าน gorm.Model)
func (r *villageRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. ลบรายละเอียดหมู่บ้าน (VillageDetail) ที่ผูกอยู่ก่อน
		if err := tx.Where("village_id = ?", id).Delete(&entity.VillageDetail{}).Error; err != nil {
			return err
		}
		// 2. ลบข้อมูลหมู่บ้าน (Village)
		if err := tx.Delete(&entity.Village{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}
