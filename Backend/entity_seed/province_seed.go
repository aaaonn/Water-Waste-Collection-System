package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedProvinces เพิ่มข้อมูลจังหวัดจำลอง
func SeedProvinces(db *gorm.DB) error {
	var count int64
	db.Model(&entity.Province{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] Provinces table already has data, skipping...")
		return nil
	}

	provinces := []entity.Province{
		{
			ProvinceName: "หนองคาย",
		},
	}

	for _, p := range provinces {
		if err := db.Create(&p).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded provinces successfully (หนองคาย)")
	return nil
}
