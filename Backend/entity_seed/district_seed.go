package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedDistricts เพิ่มข้อมูลอำเภอจำลอง
func SeedDistricts(db *gorm.DB) error {
	var count int64
	db.Model(&entity.District{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] Districts table already has data, skipping...")
		return nil
	}

	districts := []entity.District{
		{
			ProvinceID:   1, // หนองคาย
			DistrictName: "โพนพิสัย",
		},
	}

	for _, d := range districts {
		if err := db.Create(&d).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded districts successfully (โพนพิสัย)")
	return nil
}
