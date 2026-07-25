package core

import (
	"fmt"
	"log"
	"os"

	"backend/entity"
	"backend/entity_seed"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() *gorm.DB {
	var err error

	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	sslmode := os.Getenv("DB_SSLMODE")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode,
	)

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to the database")
	}
	log.Println("Successfully connected to the database")

	// AutoMigrate ตารางและ Enum ทั้ง 15 ตารางหลักในระบบ
	log.Println("Running database auto-migrations...")

	//========== ตอน Dev เท่านั้น ==========
	ResetByDropSchema(DB) // Drop ตารางทั้งหมดเลย
	// ResetDatabase(DB)     // ลบข้อมูลในตารางทั้งหมด (ล้างข้อมูลเฉยๆ เพื่อเตรียม Seed)

	err = DB.AutoMigrate(
		&entity.Province{},
		&entity.District{},
		&entity.Subdistrict{},
		&entity.SubdistrictInfo{},
		&entity.Village{},
		&entity.VillageDetail{},
		&entity.Login{},
		&entity.Staff{},
		&entity.HouseHold{},
		&entity.WaterUnit{},
		&entity.WaterUnitHistory{},
		&entity.GarbageSizeCost{},
		&entity.WaterReading{},
		&entity.GarbageReading{},
		&entity.GarbageReadingDetail{},
		&entity.Invoice{},
		&entity.PaymentTransaction{},
	)
	if err != nil {
		log.Printf("Failed to run database auto-migrations: %v", err)
	} else {
		log.Println("Database auto-migrations completed successfully")

		//========== ตอน Dev เท่านั้น ==========
		entity_seed.SeedAll(DB) // เติมข้อมูลจำลองทั้ง 15 ตาราง
	}

	log.Println("Database connection established successfully")

	return DB
}

// ResetByDropSchema ทำการ Drop Schema public ทั้งหมดแล้วสร้างขึ้นมาใหม่ (Drop ทุกตารางแบบรวดเร็วและสะอาดที่สุด)
func ResetByDropSchema(db *gorm.DB) {
	log.Println("Resetting database by recreating public schema...")
	if err := db.Exec("DROP SCHEMA public CASCADE;").Error; err != nil {
		log.Printf("Failed to drop schema: %v", err)
		return
	}
	if err := db.Exec("CREATE SCHEMA public;").Error; err != nil {
		log.Printf("Failed to recreate schema: %v", err)
		return
	}
	log.Println("==================================================")
	log.Println("📅✅ SCHEMA PUBLIC DROPPED AND RECREATED SUCCESSFULLY!")
	log.Println("==================================================")
}

// ResetDatabase ทำการล้างข้อมูลในตารางทั้งหมดแบบ Cascade และรีเซ็ตค่า Serial IDs เริ่มต้นกลับเป็น 1
func ResetDatabase(db *gorm.DB) {
	log.Println("Truncating and clearing data from all tables...")
	tables := []string{
		"payment_transactions",
		"invoices",
		"garbage_reading_details",
		"garbage_readings",
		"water_readings",
		"garbage_size_costs",
		"water_units",
		"house_holds",
		"staffs",
		"logins",
		"village_details",
		"villages",
		"subdistrict_infos",
		"subdistricts",
		"districts",
		"provinces",
	}

	for _, table := range tables {
		query := fmt.Sprintf("TRUNCATE TABLE %s RESTART IDENTITY CASCADE;", table)
		if err := db.Exec(query).Error; err != nil {
			log.Printf("Failed to truncate table %s: %v", table, err)
		}
	}
	log.Println("==================================================")
	log.Println("🧹✅ ALL TABLES CLEARED SUCCESSFULLY!")
	log.Println("==================================================")
}
