package entity_seed

import (
	"log"

	"gorm.io/gorm"
)

// SeedAll รันฟังก์ชัน Seed ข้อมูลจำลองทั้งหมดในฐานข้อมูลเรียงตามลำดับความสัมพันธ์ของคีย์นอก
func SeedAll(db *gorm.DB) error {
	log.Println("==================================================")
	log.Println("🚀 START DATABASE SEEDING (ต.ทุ่งหลวง จ.หนองคาย)...")
	log.Println("==================================================")

	// 1. จังหวัด
	if err := SeedProvinces(db); err != nil {
		log.Printf("❌ SeedProvinces failed: %v", err)
		return err
	}

	// 2. อำเภอ
	if err := SeedDistricts(db); err != nil {
		log.Printf("❌ SeedDistricts failed: %v", err)
		return err
	}

	// 3. ตำบล
	if err := SeedSubdistricts(db); err != nil {
		log.Printf("❌ SeedSubdistricts failed: %v", err)
		return err
	}

	// 4. หมู่บ้าน
	if err := SeedVillages(db); err != nil {
		log.Printf("❌ SeedVillages failed: %v", err)
		return err
	}

	// 4.5 ข้อมูลองค์กร (นายก, ที่อยู่)
	if err := SeedSubdistrictInfo(db); err != nil {
		log.Printf("❌ SeedSubdistrictInfo failed: %v", err)
		return err
	}

	// 5. รายละเอียดหมู่บ้าน
	if err := SeedVillageDetails(db); err != nil {
		log.Printf("❌ SeedVillageDetails failed: %v", err)
		return err
	}

	// 6. บัญชีเข้าระบบ
	if err := SeedLogins(db); err != nil {
		log.Printf("❌ SeedLogins failed: %v", err)
		return err
	}

	// 8. ข้อมูลสต๊าฟพนักงาน
	if err := SeedStaffs(db); err != nil {
		log.Printf("❌ SeedStaffs failed: %v", err)
		return err
	}

	// 9. ขั้นบันไดค่าน้ำประปา
	if err := SeedWaterUnits(db); err != nil {
		log.Printf("❌ SeedWaterUnits failed: %v", err)
		return err
	}

	// 9.5 ประวัติขั้นบันไดค่าน้ำประปา (สำหรับการทดสอบย้อนหลัง)
	if err := SeedWaterUnitHistory(db); err != nil {
		log.Printf("❌ SeedWaterUnitHistory failed: %v", err)
		return err
	}

	// 10. ขนาดถังขยะและค่านิยมบริการ
	if err := SeedGarbageSizeCosts(db); err != nil {
		log.Printf("❌ SeedGarbageSizeCosts failed: %v", err)
		return err
	}

	// 11. ข้อมูลครัวเรือนหลัก (ย้ายมาอยู่หลัง GarbageSizeCosts เพราะต้องอ้างอิง GarbageSizeID)
	if err := SeedHouseHolds(db); err != nil {
		log.Printf("❌ SeedHouseHolds failed: %v", err)
		return err
	}

	// 11. ประวัติการจดบันทึกหน่วยน้ำประปา
	if err := SeedWaterReadings(db); err != nil {
		log.Printf("❌ SeedWaterReadings failed: %v", err)
		return err
	}

	// 12. ประวัติการมาจดและเก็บเศษขยะ
	if err := SeedGarbageReadings(db); err != nil {
		log.Printf("❌ SeedGarbageReadings failed: %v", err)
		return err
	}

	// 13. รายละเอียดประเภทขยะแยกถังของการเก็บขยะ
	if err := SeedGarbageReadingDetails(db); err != nil {
		log.Printf("❌ SeedGarbageReadingDetails failed: %v", err)
		return err
	}

	// 14. ใบแจ้งหนี้
	if err := SeedInvoices(db); err != nil {
		log.Printf("❌ SeedInvoices failed: %v", err)
		return err
	}

	// 15. รายการประวัติธุรกรรมการชำระเงิน
	if err := SeedPaymentTransactions(db); err != nil {
		log.Printf("❌ SeedPaymentTransactions failed: %v", err)
		return err
	}

	log.Println("==================================================")
	log.Println("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!")
	log.Println("==================================================")
	return nil
}
