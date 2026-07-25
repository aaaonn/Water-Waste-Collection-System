package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedWaterUnitHistory เติมข้อมูลอัตราค่าน้ำประปาประวัติศาสตร์ย้อนหลังเดือนเมษายน 2569 (2026) ด้วยราคาที่แตกต่างอย่างเห็นได้ชัด
func SeedWaterUnitHistory(db *gorm.DB) error {
	var count int64
	db.Model(&entity.WaterUnitHistory{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] WaterUnitHistory table already has data, skipping...")
		return nil
	}

	floatPtr := func(f float64) *float64 {
		return &f
	}

	// ใช้ราคาที่สูงขึ้นอย่างเห็นได้ชัด เพื่อทดสอบเปรียบเทียบในไฟล์รายงาน Excel
	historyUnits := []entity.WaterUnitHistory{
		{SubdistrictID: 1, StartUnit: 0, EndUnit: floatPtr(5), Cost: 10.0, Month: 4, Year: 2026},
		{SubdistrictID: 1, StartUnit: 6, EndUnit: floatPtr(10), Cost: 15.0, Month: 4, Year: 2026},
		{SubdistrictID: 1, StartUnit: 11, EndUnit: floatPtr(15), Cost: 20.0, Month: 4, Year: 2026},
		{SubdistrictID: 1, StartUnit: 16, EndUnit: floatPtr(20), Cost: 25.0, Month: 4, Year: 2026},
		{SubdistrictID: 1, StartUnit: 21, EndUnit: floatPtr(25), Cost: 30.0, Month: 4, Year: 2026},
		{SubdistrictID: 1, StartUnit: 26, EndUnit: floatPtr(30), Cost: 35.0, Month: 4, Year: 2026},
		{SubdistrictID: 1, StartUnit: 31, EndUnit: floatPtr(40), Cost: 40.0, Month: 4, Year: 2026},
		{SubdistrictID: 1, StartUnit: 41, EndUnit: floatPtr(50), Cost: 45.0, Month: 4, Year: 2026},
		{SubdistrictID: 1, StartUnit: 51, EndUnit: floatPtr(60), Cost: 50.0, Month: 4, Year: 2026},
		{SubdistrictID: 1, StartUnit: 61, EndUnit: nil, Cost: 60.0, Month: 4, Year: 2026},
	}

	for _, wh := range historyUnits {
		if err := db.Create(&wh).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded water units history successfully (เมษายน 2569 อัตราทดสอบพิเศษ)")
	return nil
}
