package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedHouseHolds เพิ่มข้อมูลครัวเรือนจำลอง 5 หลังคาเรือน
func SeedHouseHolds(db *gorm.DB) error {
	var count int64
	db.Model(&entity.HouseHold{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] HouseHolds table already has data, skipping...")
		return nil
	}

	households := []entity.HouseHold{
		{VillageID: 1, LoginID: 6, WaterStatus: entity.StatusActive, GarbageStatus: entity.StatusActive, HouseNumber: "101", HouseCode: "HC-10001", TitleName: entity.Mister, FirstName: "ประสิทธิ์", LastName: "มีสุข", CitizenID: "1234567890121", PhoneNumber: "0811111111", WaterUserID: "W-101"},
		{VillageID: 2, LoginID: 7, WaterStatus: entity.StatusActive, GarbageStatus: entity.StatusActive, HouseNumber: "202", HouseCode: "HC-10002", TitleName: entity.Miss, FirstName: "สมใจ", LastName: "ไปดี", CitizenID: "1234567890122", PhoneNumber: "0822222222", WaterUserID: "W-102"},
		{VillageID: 3, LoginID: 8, WaterStatus: entity.StatusActive, GarbageStatus: entity.StatusActive, HouseNumber: "303", HouseCode: "HC-10003", TitleName: entity.Mister, FirstName: "ปรีชา", LastName: "ชาญชัย", CitizenID: "1234567890123", PhoneNumber: "0833333333", WaterUserID: "W-103"},
		{VillageID: 4, LoginID: 9, WaterStatus: entity.StatusActive, GarbageStatus: entity.StatusActive, HouseNumber: "404", HouseCode: "HC-10004", TitleName: entity.Miss, FirstName: "รดา", LastName: "รุ่งเรือง", CitizenID: "1234567890124", PhoneNumber: "0844444444", WaterUserID: "W-104"},
		{VillageID: 5, LoginID: 10, WaterStatus: entity.StatusActive, GarbageStatus: entity.StatusActive, HouseNumber: "505", HouseCode: "HC-10005", TitleName: entity.Mister, FirstName: "กมล", LastName: "สุขดี", CitizenID: "1234567890125", PhoneNumber: "0855555555", WaterUserID: "W-105"},
	}

	for _, h := range households {
		if err := db.Create(&h).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded households successfully (5 ครัวเรือน)")
	return nil
}
