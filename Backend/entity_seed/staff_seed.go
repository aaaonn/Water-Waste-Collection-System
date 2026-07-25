package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedStaffs เพิ่มข้อมูลเจ้าหน้าที่ระบบจำลอง 5 คน
func SeedStaffs(db *gorm.DB) error {
	var count int64
	db.Model(&entity.Staff{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] Staffs table already has data, skipping...")
		return nil
	}

	staffs := []entity.Staff{
		{UserID: 1, TitleName: entity.Mister, FirstName: "พงษ์ศักดิ์", LastName: "แสนดี", PhoneNumber: "0812345678"},
		{UserID: 2, TitleName: entity.Miss, FirstName: "กานดา", LastName: "รักงาน", PhoneNumber: "0823456789"},
		{UserID: 3, TitleName: entity.Mister, FirstName: "วิชัย", LastName: "ชัยชนะ", PhoneNumber: "0834567890"},
		{UserID: 4, TitleName: entity.Misses, FirstName: "สมจิตร", LastName: "คิดดี", PhoneNumber: "0845678901"},
		{UserID: 5, TitleName: entity.Mister, FirstName: "สายยันต์", LastName: "ทุ่งทอง", PhoneNumber: "0856789012"},
		{UserID: 11, TitleName: entity.Mister, FirstName: "ผู้ดูแลระบบ", LastName: "สูงสุด", PhoneNumber: "0899999999"},
	}

	for _, s := range staffs {
		if err := db.Create(&s).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded staffs successfully (6 คน)")
	return nil
}
