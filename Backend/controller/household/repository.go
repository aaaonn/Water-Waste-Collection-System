package household

import (
	"errors"
	"time"

	"backend/entity"
	"gorm.io/gorm"
)

// HouseholdRepository อินเตอร์เฟสสำหรับจัดการข้อมูล Household ใน Database
type HouseholdRepository interface {
	GetAll() ([]entity.HouseHold, error)
	GetByVillageID(villageID uint) ([]entity.HouseHold, error)
	GetByID(id uint) (*entity.HouseHold, error)
	GetVillageByID(id uint) (*entity.Village, error)
	CheckRecordedThisMonth(householdID uint) (isWaterRecorded bool, isGarbageRecorded bool, err error)
	CheckRecordedMonth(householdID uint, month int, year int) (isWaterRecorded bool, isGarbageRecorded bool, err error)
	Create(household *entity.HouseHold) error
	Update(household *entity.HouseHold) error
	Delete(id uint) error
	GetByLoginID(loginID uint) (*entity.HouseHold, error)
	GetWaterReadingByMonth(householdID uint, month int, year int) (*entity.WaterReading, error)
	GetGarbageReadingByMonth(householdID uint, month int, year int) (*entity.GarbageReading, error)
}

type householdRepository struct {
	db *gorm.DB
}

// NewHouseholdRepository สร้างอินสแตนซ์ของ Repository
func NewHouseholdRepository(db *gorm.DB) HouseholdRepository {
	return &householdRepository{db: db}
}

// GetAll ค้นหาครัวเรือนทั้งหมดในระบบ
func (r *householdRepository) GetAll() ([]entity.HouseHold, error) {
	var households []entity.HouseHold
	err := r.db.Preload("Login").Preload("WaterReadings").Preload("GarbageReadings.GarbageReadingDetails").Order("house_number").Find(&households).Error
	if err != nil {
		return nil, err
	}
	return households, nil
}

// GetByVillageID ค้นหาครัวเรือนทั้งหมดตาม ID ของหมู่บ้าน พร้อมเรียงลำดับตามบ้านเลขที่
func (r *householdRepository) GetByVillageID(villageID uint) ([]entity.HouseHold, error) {
	var households []entity.HouseHold
	err := r.db.Preload("Login").Preload("WaterReadings").Preload("GarbageReadings.GarbageReadingDetails").Where("village_id = ?", villageID).Order("house_number").Find(&households).Error
	if err != nil {
		return nil, err
	}
	return households, nil
}

// CheckRecordedThisMonth ตรวจสอบว่าครัวเรือนนี้มีการจดค่าน้ำและค่าขยะในเดือนปัจจุบันแล้วหรือไม่
func (r *householdRepository) CheckRecordedThisMonth(householdID uint) (isWaterRecorded bool, isGarbageRecorded bool, err error) {
	return r.CheckRecordedMonth(householdID, 0, 0)
}

// CheckRecordedMonth ตรวจสอบว่าครัวเรือนนี้มีการจดค่าน้ำและค่าขยะในเดือนและปีที่ระบุแล้วหรือไม่
func (r *householdRepository) CheckRecordedMonth(householdID uint, month int, year int) (isWaterRecorded bool, isGarbageRecorded bool, err error) {
	now := time.Now()
	if month <= 0 || month > 12 {
		month = int(now.Month())
	}
	if year <= 0 {
		year = now.Year()
	}

	startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	var waterCount int64
	err = r.db.Model(&entity.WaterReading{}).
		Where("house_hold_id = ? AND reading_date BETWEEN ? AND ?", householdID, startOfMonth, endOfMonth).
		Count(&waterCount).Error
	if err != nil {
		return false, false, err
	}

	var garbageCount int64
	err = r.db.Model(&entity.GarbageReading{}).
		Where("house_hold_id = ? AND reading_date BETWEEN ? AND ?", householdID, startOfMonth, endOfMonth).
		Count(&garbageCount).Error
	if err != nil {
		return false, false, err
	}

	return waterCount > 0, garbageCount > 0, nil
}

// GetVillageByID ค้นหาข้อมูลหมู่บ้านตาม ID เพื่อนำไปใช้งานต่อ (เช่นดึงเลขหมู่ที่)
func (r *householdRepository) GetVillageByID(id uint) (*entity.Village, error) {
	var village entity.Village
	err := r.db.First(&village, id).Error
	if err != nil {
		return nil, err
	}
	return &village, nil
}

// GetByID ค้นหาข้อมูลครัวเรือน 1 รายการตาม ID หลักของครัวเรือนนั้น
func (r *householdRepository) GetByID(id uint) (*entity.HouseHold, error) {
	var household entity.HouseHold
	err := r.db.Preload("Login").Preload("WaterReadings").Preload("GarbageReadings.GarbageReadingDetails").First(&household, id).Error
	if err != nil {
		return nil, err
	}
	return &household, nil
}

// GetByLoginID ค้นหาข้อมูลครัวเรือนตาม Login ID
func (r *householdRepository) GetByLoginID(loginID uint) (*entity.HouseHold, error) {
	var household entity.HouseHold
	err := r.db.Preload("Login").Preload("WaterReadings").Preload("GarbageReadings.GarbageReadingDetails").Where("login_id = ?", loginID).First(&household).Error
	if err != nil {
		return nil, err
	}
	return &household, nil
}

// Create เพิ่มข้อมูลครัวเรือนใหม่เข้าสู่ระบบ (พร้อมผูกข้อมูล Login อัตโนมัติตามที่มีมาใน Object)
func (r *householdRepository) Create(household *entity.HouseHold) error {
	return r.db.Create(household).Error
}

// Update บันทึกการเปลี่ยนแปลงของข้อมูลครัวเรือนที่มีอยู่เดิม พร้อมบันทึกความสัมพันธ์
func (r *householdRepository) Update(household *entity.HouseHold) error {
	if err := r.db.Save(household).Error; err != nil {
		return err
	}
	// บันทึกข้อมูล Login หากมีการแก้ไข (Username/Password)
	if household.Login != nil {
		if err := r.db.Save(household.Login).Error; err != nil {
			return err
		}
	}
	// บันทึกความสัมพันธ์ค่าน้ำถ้ามี
	if len(household.WaterReadings) > 0 {
		if err := r.db.Save(&household.WaterReadings[0]).Error; err != nil {
			return err
		}
	}
	// บันทึกความสัมพันธ์ค่าขยะถ้ามี
	if len(household.GarbageReadings) > 0 {
		if err := r.db.Save(&household.GarbageReadings[0]).Error; err != nil {
			return err
		}
		if len(household.GarbageReadings[0].GarbageReadingDetails) > 0 {
			if err := r.db.Save(&household.GarbageReadings[0].GarbageReadingDetails[0]).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

// Delete ลบข้อมูลครัวเรือนและบัญชีเข้าระบบที่เกี่ยวข้อง (Soft Delete)
func (r *householdRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var h entity.HouseHold
		if err := tx.First(&h, id).Error; err != nil {
			return err
		}
		// Soft delete associated Login
		if err := tx.Delete(&entity.Login{}, h.LoginID).Error; err != nil {
			return err
		}
		// Soft delete Household
		if err := tx.Delete(&entity.HouseHold{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}

// GetWaterReadingByMonth ดึงข้อมูลค่าน้ำประจำรอบเดือนและปีที่ระบุ
func (r *householdRepository) GetWaterReadingByMonth(householdID uint, month int, year int) (*entity.WaterReading, error) {
	var wr entity.WaterReading
	startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	err := r.db.Where("house_hold_id = ? AND reading_date BETWEEN ? AND ?", householdID, startOfMonth, endOfMonth).First(&wr).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &wr, nil
}

// GetGarbageReadingByMonth ดึงข้อมูลค่าเก็บขยะประจำรอบเดือนและปีที่ระบุ
func (r *householdRepository) GetGarbageReadingByMonth(householdID uint, month int, year int) (*entity.GarbageReading, error) {
	var gr entity.GarbageReading
	startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	err := r.db.Preload("GarbageReadingDetails.GarbageSize").Where("house_hold_id = ? AND reading_date BETWEEN ? AND ?", householdID, startOfMonth, endOfMonth).First(&gr).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &gr, nil
}
