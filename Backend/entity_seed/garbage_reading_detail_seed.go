package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedGarbageReadingDetails เพิ่มรายละเอียดประเภทและจำนวนขยะ 10 รายการ
func SeedGarbageReadingDetails(db *gorm.DB) error {
	var count int64
	db.Model(&entity.GarbageReadingDetail{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] GarbageReadingDetails table already has data, skipping...")
		return nil
	}

	details := []entity.GarbageReadingDetail{
		// GarbageReadingID 1 (user1 Month 1) -> ขนาดเล็ก (Cost: 20) + ขนาดใหญ่ (Cost: 60) = 80
		{GarbageReadingID: 1, GarbageSizeID: 1, Amount: 1},
		{GarbageReadingID: 1, GarbageSizeID: 3, Amount: 1},
		// GarbageReadingID 2 (user1 Month 2) -> ขนาดเล็ก (Cost: 20) + ขนาดใหญ่ (Cost: 60) = 80
		{GarbageReadingID: 2, GarbageSizeID: 1, Amount: 1},
		{GarbageReadingID: 2, GarbageSizeID: 3, Amount: 1},

		// GarbageReadingID 3 (user2 Month 1) -> ขนาดเล็ก (Cost: 20)
		{GarbageReadingID: 3, GarbageSizeID: 1, Amount: 1},
		// GarbageReadingID 4 (user2 Month 2) -> ขนาดเล็ก (Cost: 20)
		{GarbageReadingID: 4, GarbageSizeID: 1, Amount: 1},

		// GarbageReadingID 5 (user3 Month 1) -> ขนาดใหญ่ x 2 (Cost: 60 x 2 = 120)
		{GarbageReadingID: 5, GarbageSizeID: 3, Amount: 2},
		// GarbageReadingID 6 (user3 Month 2) -> ขนาดใหญ่ x 2 (Cost: 60 x 2 = 120)
		{GarbageReadingID: 6, GarbageSizeID: 3, Amount: 2},

		// GarbageReadingID 7 (user4 Month 1) -> ขนาดใหญ่ (Cost: 60)
		{GarbageReadingID: 7, GarbageSizeID: 3, Amount: 1},
		// GarbageReadingID 8 (user4 Month 2) -> ขนาดใหญ่ (Cost: 60)
		{GarbageReadingID: 8, GarbageSizeID: 3, Amount: 1},

		// GarbageReadingID 9 (user5 Month 1) -> ขนาดกลาง (Cost: 40)
		{GarbageReadingID: 9, GarbageSizeID: 2, Amount: 1},
		// GarbageReadingID 10 (user5 Month 2) -> ขนาดกลาง (Cost: 40)
		{GarbageReadingID: 10, GarbageSizeID: 2, Amount: 1},
	}

	for _, d := range details {
		if err := db.Create(&d).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded garbage reading details successfully (12 รายการ)")
	return nil
}
