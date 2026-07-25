package entity_seed

import (
	"log"
	"time"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedWaterReadings เพิ่มประวัติการจดมาตรวัดน้ำ 10 รายการ (2 รายการย้อนหลังต่อ 5 ครัวเรือน)
func SeedWaterReadings(db *gorm.DB) error {
	var count int64
	db.Model(&entity.WaterReading{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] WaterReadings table already has data, skipping...")
		return nil
	}

	// ช่วงเวลาจำลอง
	timeMonth1 := time.Date(2026, time.April, 25, 9, 30, 0, 0, time.Local)
	timeMonth2 := time.Date(2026, time.May, 25, 10, 15, 0, 0, time.Local)

	readings := []entity.WaterReading{
		// ครัวเรือน 1
		{HouseHoldID: 1, StaffID: 4, PrevReading: 100, CurrReading: 112, UnitConsumed: 12, TotalAmount: 165.0, ReadingDate: timeMonth1},
		{HouseHoldID: 1, StaffID: 4, PrevReading: 112, CurrReading: 128, UnitConsumed: 16, TotalAmount: 84.5, ReadingDate: timeMonth2},

		// ครัวเรือน 2
		{HouseHoldID: 2, StaffID: 4, PrevReading: 80, CurrReading: 84, UnitConsumed: 4, TotalAmount: 40.0, ReadingDate: timeMonth1},
		{HouseHoldID: 2, StaffID: 4, PrevReading: 84, CurrReading: 93, UnitConsumed: 9, TotalAmount: 40.0, ReadingDate: timeMonth2},

		// ครัวเรือน 3
		{HouseHoldID: 3, StaffID: 4, PrevReading: 210, CurrReading: 232, UnitConsumed: 22, TotalAmount: 410.0, ReadingDate: timeMonth1},
		{HouseHoldID: 3, StaffID: 4, PrevReading: 232, CurrReading: 260, UnitConsumed: 28, TotalAmount: 198.5, ReadingDate: timeMonth2},

		// ครัวเรือน 4
		{HouseHoldID: 4, StaffID: 5, PrevReading: 50, CurrReading: 65, UnitConsumed: 15, TotalAmount: 225.0, ReadingDate: timeMonth1},
		{HouseHoldID: 4, StaffID: 5, PrevReading: 65, CurrReading: 73, UnitConsumed: 8, TotalAmount: 35.0, ReadingDate: timeMonth2},

		// ครัวเรือน 5
		{HouseHoldID: 5, StaffID: 5, PrevReading: 145, CurrReading: 150, UnitConsumed: 5, TotalAmount: 50.0, ReadingDate: timeMonth1},
		{HouseHoldID: 5, StaffID: 5, PrevReading: 150, CurrReading: 171, UnitConsumed: 21, TotalAmount: 131.5, ReadingDate: timeMonth2},
	}

	for _, wr := range readings {
		if err := db.Create(&wr).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded water readings successfully (10 รายการ)")
	return nil
}
