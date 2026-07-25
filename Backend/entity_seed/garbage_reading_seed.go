package entity_seed

import (
	"log"
	"time"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedGarbageReadings เพิ่มประวัติการไปเก็บเศษขยะหลัก 10 รายการ (2 รายการย้อนหลังต่อ 5 ครัวเรือน)
func SeedGarbageReadings(db *gorm.DB) error {
	var count int64
	db.Model(&entity.GarbageReading{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] GarbageReadings table already has data, skipping...")
		return nil
	}

	// ช่วงเวลาจำลอง
	timeMonth1 := time.Date(2026, time.April, 28, 8, 0, 0, 0, time.Local)
	timeMonth2 := time.Date(2026, time.May, 28, 8, 30, 0, 0, time.Local)

	readings := []entity.GarbageReading{
		// ครัวเรือน 1
		{HouseHoldID: 1, StaffID: 4, ReadingDate: timeMonth1, TotalAmount: 80.0},
		{HouseHoldID: 1, StaffID: 4, ReadingDate: timeMonth2, TotalAmount: 80.0},

		// ครัวเรือน 2
		{HouseHoldID: 2, StaffID: 4, ReadingDate: timeMonth1, TotalAmount: 20.0},
		{HouseHoldID: 2, StaffID: 4, ReadingDate: timeMonth2, TotalAmount: 20.0},

		// ครัวเรือน 3
		{HouseHoldID: 3, StaffID: 4, ReadingDate: timeMonth1, TotalAmount: 120.0},
		{HouseHoldID: 3, StaffID: 4, ReadingDate: timeMonth2, TotalAmount: 120.0},

		// ครัวเรือน 4
		{HouseHoldID: 4, StaffID: 5, ReadingDate: timeMonth1, TotalAmount: 60.0},
		{HouseHoldID: 4, StaffID: 5, ReadingDate: timeMonth2, TotalAmount: 60.0},

		// ครัวเรือน 5
		{HouseHoldID: 5, StaffID: 5, ReadingDate: timeMonth1, TotalAmount: 40.0},
		{HouseHoldID: 5, StaffID: 5, ReadingDate: timeMonth2, TotalAmount: 40.0},
	}

	for _, gr := range readings {
		if err := db.Create(&gr).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded garbage readings successfully (10 รายการ)")
	return nil
}
