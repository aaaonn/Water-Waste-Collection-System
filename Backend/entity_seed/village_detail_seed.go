package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedVillageDetails เพิ่มรายละเอียดผู้ใหญ่บ้านและจำนวนหลังคาเรือน
func SeedVillageDetails(db *gorm.DB) error {
	var count int64
	db.Model(&entity.VillageDetail{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] VillageDetails table already has data, skipping...")
		return nil
	}

	details := []entity.VillageDetail{
		{VillageID: 1, TitleName: entity.Mister, HeadmanFirstname: "สมพร", HeadmanLastname: "ดีเลิศ", NumberHouse: 120, HeadmanPhoneNumber: "0812345678"},
		{VillageID: 2, TitleName: entity.Misses, HeadmanFirstname: "สมศรี", HeadmanLastname: "จันทร์สว่าง", NumberHouse: 85, HeadmanPhoneNumber: "0812345679"},
		{VillageID: 3, TitleName: entity.Mister, HeadmanFirstname: "สมชาย", HeadmanLastname: "ยอดรัก", NumberHouse: 95, HeadmanPhoneNumber: "0812345680"},
		{VillageID: 4, TitleName: entity.Misses, HeadmanFirstname: "สมนึก", HeadmanLastname: "นามดี", NumberHouse: 110, HeadmanPhoneNumber: "0812345681"},
		{VillageID: 5, TitleName: entity.Mister, HeadmanFirstname: "บุญส่ง", HeadmanLastname: "ส่งสุข", NumberHouse: 130, HeadmanPhoneNumber: "0812345682"},
		{VillageID: 6, TitleName: entity.Mister, HeadmanFirstname: "ประเสริฐ", HeadmanLastname: "เลิศล้ำ", NumberHouse: 75, HeadmanPhoneNumber: "0812345683"},
		{VillageID: 7, TitleName: entity.Misses, HeadmanFirstname: "สุดา", HeadmanLastname: "รักดี", NumberHouse: 140, HeadmanPhoneNumber: "0812345684"},
		{VillageID: 8, TitleName: entity.Mister, HeadmanFirstname: "ทวี", HeadmanLastname: "เก่งกล้า", NumberHouse: 160, HeadmanPhoneNumber: "0812345685"},
		{VillageID: 9, TitleName: entity.Mister, HeadmanFirstname: "มานพ", HeadmanLastname: "อดทน", NumberHouse: 90, HeadmanPhoneNumber: "0812345686"},
		{VillageID: 10, TitleName: entity.Misses, HeadmanFirstname: "วิภา", HeadmanLastname: "เย็นใจ", NumberHouse: 105, HeadmanPhoneNumber: "0812345687"},
	}

	for _, d := range details {
		if err := db.Create(&d).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded village details successfully (10 ชุด)")
	return nil
}
