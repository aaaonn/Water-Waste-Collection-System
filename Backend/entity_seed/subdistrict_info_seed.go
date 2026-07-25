package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedSubdistrictInfo เพิ่มข้อมูลรายละเอียดองค์กรจำลอง (นายก และที่อยู่)
func SeedSubdistrictInfo(db *gorm.DB) error {
	var count int64
	db.Model(&entity.SubdistrictInfo{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] SubdistrictInfo table already has data, skipping...")
		return nil
	}

	info := entity.SubdistrictInfo{
		SubdistrictID: 1, // เชื่อมกับ Subdistrict ID: 1 (ทุ่งหลวง)
		TitleName:     "นาย",
		FirstName:     "สมชาย",
		LastName:      "ใจดี",
		PhoneNumber:   "0812345678",
	}

	if err := db.Create(&info).Error; err != nil {
		return err
	}

	// อัปเดตที่อยู่ให้ตาราง Subdistrict หลังสร้างหมู่บ้านแล้ว
	villageID := uint(1)
	if err := db.Model(&entity.Subdistrict{}).Where("id = ?", 1).Updates(map[string]interface{}{
		"address_number": "99/9",
		"village_id":     villageID,
	}).Error; err != nil {
		return err
	}

	log.Println("[Seed] Seeded subdistrict info successfully (ข้อมูลนายกและที่อยู่ ต.ทุ่งหลวง)")
	return nil
}
