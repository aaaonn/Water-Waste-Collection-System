package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedGarbageSizeCosts เพิ่มข้อมูลประเภทขยะและอัตราค่าเก็บขยะ 10 แบบ (ตำบลทุ่งหลวง)
func SeedGarbageSizeCosts(db *gorm.DB) error {
	var count int64
	db.Model(&entity.GarbageSizeCost{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] GarbageSizeCosts table already has data, skipping...")
		return nil
	}

	garbageCosts := []entity.GarbageSizeCost{
		{SubdistrictID: 1, SizeName: "ขนาดเล็ก (ถังเขียว 20L)", Cost: 20.0},
		{SubdistrictID: 1, SizeName: "ขนาดกลาง (ถังน้ำเงิน 50L)", Cost: 40.0},
		{SubdistrictID: 1, SizeName: "ขนาดใหญ่ (ถังเหลือง 100L)", Cost: 60.0},
	}

	for _, gc := range garbageCosts {
		if err := db.Create(&gc).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded garbage size costs successfully (3 ประเภท)")
	return nil
}
