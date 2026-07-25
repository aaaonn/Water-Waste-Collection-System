package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedSubdistricts เพิ่มข้อมูลตำบลจำลอง
func SeedSubdistricts(db *gorm.DB) error {
	var count int64
	db.Model(&entity.Subdistrict{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] Subdistricts table already has data, skipping...")
		return nil
	}

	subdistricts := []entity.Subdistrict{
		{
			DistrictID:      1, // โพนพิสัย
			SubdistrictName: "ทุ่งหลวง",
		},
	}

	for _, sd := range subdistricts {
		if err := db.Create(&sd).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded subdistricts successfully (ทุ่งหลวง)")
	return nil
}
