package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedWaterUnits เพิ่มข้อมูลอัตราค่าน้ำประปาขั้นบันได 10 ขั้น (ตำบลทุ่งหลวง)
func SeedWaterUnits(db *gorm.DB) error {
	var count int64
	db.Model(&entity.WaterUnit{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] WaterUnits table already has data, skipping...")
		return nil
	}

	floatPtr := func(f float64) *float64 {
		return &f
	}

	waterUnits := []entity.WaterUnit{
		{SubdistrictID: 1, StartUnit: 0, EndUnit: floatPtr(5), Cost: 4.0},
		{SubdistrictID: 1, StartUnit: 6, EndUnit: floatPtr(10), Cost: 5.0},
		{SubdistrictID: 1, StartUnit: 11, EndUnit: floatPtr(15), Cost: 6.0},
		{SubdistrictID: 1, StartUnit: 16, EndUnit: floatPtr(20), Cost: 7.5},
		{SubdistrictID: 1, StartUnit: 21, EndUnit: floatPtr(25), Cost: 9.0},
		{SubdistrictID: 1, StartUnit: 26, EndUnit: floatPtr(30), Cost: 11.0},
		{SubdistrictID: 1, StartUnit: 31, EndUnit: floatPtr(40), Cost: 13.5},
		{SubdistrictID: 1, StartUnit: 41, EndUnit: floatPtr(50), Cost: 16.0},
		{SubdistrictID: 1, StartUnit: 51, EndUnit: floatPtr(60), Cost: 19.0},
		{SubdistrictID: 1, StartUnit: 61, EndUnit: nil, Cost: 22.0}, // 61 หน่วยขึ้นไป (ไม่จำกัด)
	}

	for _, wu := range waterUnits {
		if err := db.Create(&wu).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded water units successfully (10 ขั้นบันได)")
	return nil
}
