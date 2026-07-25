package household_account

import (
	"backend/entity"
	"gorm.io/gorm"
)

// HouseholdAccountRepository Interface สำหรับจัดการฐานข้อมูลของบัญชีครัวเรือน
type HouseholdAccountRepository interface {
	GetHouseholdByLoginID(loginID uint) (*entity.HouseHold, error)
	GetHouseholdByID(householdID uint) (*entity.HouseHold, error)
	GetLoginByID(loginID uint) (*entity.Login, error)
	UpdatePhoneNumber(householdID uint, phoneNumber string) error
	UpdatePassword(loginID uint, passwordHash string) error
}

type householdAccountRepository struct {
	db *gorm.DB
}

// NewHouseholdAccountRepository สร้าง Instance ใหม่ของ Repository
func NewHouseholdAccountRepository(db *gorm.DB) HouseholdAccountRepository {
	return &householdAccountRepository{db: db}
}

// GetHouseholdByLoginID ดึงข้อมูลครัวเรือนจากรหัสการล็อกอิน (user_id)
func (r *householdAccountRepository) GetHouseholdByLoginID(loginID uint) (*entity.HouseHold, error) {
	var household entity.HouseHold
	err := r.db.Preload("Village").Preload("Login").Where("login_id = ?", loginID).First(&household).Error
	if err != nil {
		return nil, err
	}
	return &household, nil
}

// GetHouseholdByID ดึงข้อมูลครัวเรือนจากรหัสครัวเรือนโดยตรง
func (r *householdAccountRepository) GetHouseholdByID(householdID uint) (*entity.HouseHold, error) {
	var household entity.HouseHold
	err := r.db.Preload("Village").Preload("Login").First(&household, householdID).Error
	if err != nil {
		return nil, err
	}
	return &household, nil
}

// GetLoginByID ดึงข้อมูลล็อกอินจากรหัสล็อกอิน
func (r *householdAccountRepository) GetLoginByID(loginID uint) (*entity.Login, error) {
	var login entity.Login
	err := r.db.First(&login, loginID).Error
	if err != nil {
		return nil, err
	}
	return &login, nil
}

// UpdatePhoneNumber อัปเดตเบอร์โทรศัพท์ของครัวเรือน
func (r *householdAccountRepository) UpdatePhoneNumber(householdID uint, phoneNumber string) error {
	return r.db.Model(&entity.HouseHold{}).Where("id = ?", householdID).Update("phone_number", phoneNumber).Error
}

// UpdatePassword อัปเดตรหัสผ่านใหม่ของบัญชี
func (r *householdAccountRepository) UpdatePassword(loginID uint, passwordHash string) error {
	return r.db.Model(&entity.Login{}).Where("id = ?", loginID).Update("password_hash", passwordHash).Error
}
