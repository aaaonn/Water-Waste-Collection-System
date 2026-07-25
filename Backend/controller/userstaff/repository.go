package userstaff

import (
	"backend/entity"
	"gorm.io/gorm"
)

// UserstaffRepository อินเตอร์เฟสสำหรับจัดการข้อมูลผู้ใช้ใน Database
type UserstaffRepository interface {
	GetAll() ([]entity.Staff, error)
	GetByID(id uint) (*entity.Staff, error)
	GetFirstSubdistrict() (*entity.Subdistrict, error)
	Create(login *entity.Login, staff *entity.Staff) error
	Update(login *entity.Login, staff *entity.Staff) error
	UpdateStatus(loginID uint, status entity.UserStatus) error
	Delete(staff *entity.Staff) error
}

type userstaffRepository struct {
	db *gorm.DB
}

// NewUserstaffRepository สร้างอินสแตนซ์ของ Repository
func NewUserstaffRepository(db *gorm.DB) UserstaffRepository {
	return &userstaffRepository{db: db}
}

// GetAll ค้นหาผู้ใช้ทั้งหมดในระบบ พร้อมข้อมูล Login ที่ผูกกัน
func (r *userstaffRepository) GetAll() ([]entity.Staff, error) {
	var staffs []entity.Staff
	err := r.db.Preload("User").Find(&staffs).Error
	if err != nil {
		return nil, err
	}
	return staffs, nil
}

// GetByID ค้นหาผู้ใช้ 1 รายการตาม ID หลักของ Staff พร้อมข้อมูล Login
func (r *userstaffRepository) GetByID(id uint) (*entity.Staff, error) {
	var staff entity.Staff
	err := r.db.Preload("User").First(&staff, id).Error
	if err != nil {
		return nil, err
	}
	return &staff, nil
}

// GetFirstSubdistrict ดึงตำบลแรกจากฐานข้อมูลเพื่อใช้เป็นค่าเริ่มต้นสำหรับสร้างผู้ใช้ใหม่
func (r *userstaffRepository) GetFirstSubdistrict() (*entity.Subdistrict, error) {
	var subdistrict entity.Subdistrict
	err := r.db.First(&subdistrict).Error
	if err != nil {
		return nil, err
	}
	return &subdistrict, nil
}

// Create เพิ่มข้อมูล Login และ Staff พร้อมกันด้วย Transaction
func (r *userstaffRepository) Create(login *entity.Login, staff *entity.Staff) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// สร้าง Login ก่อน
		if err := tx.Create(login).Error; err != nil {
			return err
		}

		// เอา Login ID ที่ได้มาผูกกับ Staff
		staff.UserID = login.ID

		// สร้าง Staff ต่อ
		if err := tx.Create(staff).Error; err != nil {
			return err
		}

		return nil
	})
}

// Update บันทึกการเปลี่ยนแปลงข้อมูล
func (r *userstaffRepository) Update(login *entity.Login, staff *entity.Staff) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(login).Error; err != nil {
			return err
		}
		if err := tx.Save(staff).Error; err != nil {
			return err
		}
		return nil
	})
}

// UpdateStatus อัปเดตสถานะของผู้ใช้ในตาราง logins เช่น การ Soft Delete
func (r *userstaffRepository) UpdateStatus(loginID uint, status entity.UserStatus) error {
	return r.db.Model(&entity.Login{}).Where("id = ?", loginID).Update("status", status).Error
}

// Delete ทำการ Soft Delete ข้อมูลผ่าน GORM
func (r *userstaffRepository) Delete(staff *entity.Staff) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// ลบ Staff ก่อน
		if err := tx.Delete(staff).Error; err != nil {
			return err
		}
		// แล้วลบ Login ที่ผูกกัน
		if staff.User != nil {
			if err := tx.Delete(staff.User).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
