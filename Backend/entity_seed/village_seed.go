package entity_seed

import (
	"log"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedVillages เพิ่มข้อมูลรายชื่อหมู่บ้านจำลอง 10 หมู่
func SeedVillages(db *gorm.DB) error {
	var count int64
	db.Model(&entity.Village{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] Villages table already has data, skipping...")
		return nil
	}

	villages := []entity.Village{
		{SubdistrictID: 1, VillageName: "บ้านทุ่งหลวง", VillageNumber: 1},
		{SubdistrictID: 1, VillageName: "บ้านดอนหนาด", VillageNumber: 2},
		{SubdistrictID: 1, VillageName: "บ้านโพธิ์ทอง", VillageNumber: 3},
		{SubdistrictID: 1, VillageName: "บ้านหนองสวน", VillageNumber: 4},
		{SubdistrictID: 1, VillageName: "บ้านดอนยาง", VillageNumber: 5},
		{SubdistrictID: 1, VillageName: "บ้านโนนสว่าง", VillageNumber: 6},
		{SubdistrictID: 1, VillageName: "บ้านหนองบัว", VillageNumber: 7},
		{SubdistrictID: 1, VillageName: "บ้านนาดี", VillageNumber: 8},
		{SubdistrictID: 1, VillageName: "บ้านสันติสุข", VillageNumber: 9},
		{SubdistrictID: 1, VillageName: "บ้านร่มเย็น", VillageNumber: 10},
	}

	for _, v := range villages {
		if err := db.Create(&v).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded villages successfully (10 หมู่บ้านใน ต.ทุ่งหลวง)")
	return nil
}
