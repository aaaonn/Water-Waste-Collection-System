package householde_list

import (
	"backend/entity"
	"time"

	"gorm.io/gorm"
)

type MobileHouseholdRepository interface {
	GetHouseholdsBySubdistrict(subdistrictID uint) ([]entity.HouseHold, error)
	GetInvoicesByMonthAndYear(startOfMonth, endOfMonth time.Time) ([]entity.Invoice, error)
	GetHouseholdByID(householdID uint, subdistrictID uint) (*entity.HouseHold, error)
}

type mobileHouseholdRepository struct {
	db *gorm.DB
}

func NewMobileHouseholdRepository(db *gorm.DB) MobileHouseholdRepository {
	return &mobileHouseholdRepository{db: db}
}

// GetHouseholdsBySubdistrict ดึงข้อมูลครัวเรือนทั้งหมดที่สังกัดตำบลนั้น ๆ พร้อมข้อมูลหมู่บ้าน
func (r *mobileHouseholdRepository) GetHouseholdsBySubdistrict(subdistrictID uint) ([]entity.HouseHold, error) {
	var households []entity.HouseHold

	// JOIN villages เพื่อเลือกเฉพาะครัวเรือนที่อยู่ในตำบล (subdistrict_id) ของพนักงานสำรวจ
	err := r.db.Preload("Village").
		Joins("JOIN villages ON villages.id = house_holds.village_id").
		Where("villages.subdistrict_id = ?", subdistrictID).
		Order("villages.village_number, house_holds.house_number").
		Find(&households).Error

	if err != nil {
		return nil, err
	}
	return households, nil
}

// GetInvoicesByMonthAndYear ดึงรายการใบแจ้งหนี้ทั้งหมดในช่วงวันที่กำหนด
func (r *mobileHouseholdRepository) GetInvoicesByMonthAndYear(startOfMonth, endOfMonth time.Time) ([]entity.Invoice, error) {
	var invoices []entity.Invoice

	// ค้นหาใบแจ้งหนี้ที่มีสถานะไม่ถูกยกเลิก และอยู่ในช่วงวันของรอบบิลนั้น ๆ
	err := r.db.Where("issue_date >= ? AND issue_date <= ? AND status != ?", startOfMonth, endOfMonth, entity.InvoiceCancelled).
		Find(&invoices).Error

	if err != nil {
		return nil, err
	}
	return invoices, nil
}

// GetHouseholdByID ดึงข้อมูลครัวเรือนเดี่ยวตาม ID โดยตรวจสอบสิทธิ์ด้วย subdistrictID
func (r *mobileHouseholdRepository) GetHouseholdByID(householdID uint, subdistrictID uint) (*entity.HouseHold, error) {
	var household entity.HouseHold
	err := r.db.Preload("Village.Subdistrict.District.Province").
		Preload("WaterReadings", func(db *gorm.DB) *gorm.DB {
			return db.Order("water_readings.reading_date DESC")
		}).
		Preload("GarbageReadings", func(db *gorm.DB) *gorm.DB {
			return db.Order("garbage_readings.reading_date DESC")
		}).
		Preload("GarbageReadings.GarbageReadingDetails").
		Preload("GarbageReadings.GarbageReadingDetails.GarbageSize").
		Preload("Invoices.WaterReading").
		Preload("Invoices.GarbageReading").
		Preload("Invoices.GarbageReading.GarbageReadingDetails").
		Preload("Invoices.GarbageReading.GarbageReadingDetails.GarbageSize").
		Joins("JOIN villages ON villages.id = house_holds.village_id").
		Where("house_holds.id = ? AND villages.subdistrict_id = ?", householdID, subdistrictID).
		First(&household).Error
	if err != nil {
		return nil, err
	}
	return &household, nil
}
