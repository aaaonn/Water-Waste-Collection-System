package entity_seed

import (
	"log"
	"time"

	"backend/entity"
	"gorm.io/gorm"
)

// SeedInvoices เพิ่มใบแจ้งหนี้ค่าน้ำและขยะรวม 10 รายการ (2 บิลย้อนหลังต่อ 5 ครัวเรือน)
func SeedInvoices(db *gorm.DB) error {
	var count int64
	db.Model(&entity.Invoice{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] Invoices table already has data, skipping...")
		return nil
	}

	timeMonth1Issue := time.Date(2026, time.April, 30, 8, 0, 0, 0, time.Local)
	timeMonth1Due := time.Date(2026, time.May, 10, 18, 0, 0, 0, time.Local)

	timeMonth2Issue := time.Date(2026, time.May, 30, 8, 0, 0, 0, time.Local)
	timeMonth2Due := time.Date(2026, time.June, 10, 18, 0, 0, 0, time.Local)

	invoices := []entity.Invoice{
		// ครัวเรือน 1 (ถังเล็ก 20 + ถังใหญ่ 60 = 80 ต่อเดือน)
		{HouseHoldID: 1, WaterReadingID: uintPointer(1), GarbageReadingID: uintPointer(1), TotalAmount: 137.0, Status: entity.InvoicePaid, ExternalRef: "INV-202604-001", IssueDate: timeMonth1Issue, DueDate: timeMonth1Due},
		{HouseHoldID: 1, WaterReadingID: uintPointer(2), GarbageReadingID: uintPointer(2), TotalAmount: 164.5, Status: entity.InvoicePaid, ExternalRef: "INV-202605-001", IssueDate: timeMonth2Issue, DueDate: timeMonth2Due},

		// ครัวเรือน 2
		{HouseHoldID: 2, WaterReadingID: uintPointer(3), GarbageReadingID: uintPointer(3), TotalAmount: 60.0, Status: entity.InvoicePaid, ExternalRef: "INV-202604-002", IssueDate: timeMonth1Issue, DueDate: timeMonth1Due},
		{HouseHoldID: 2, WaterReadingID: uintPointer(4), GarbageReadingID: uintPointer(4), TotalAmount: 60.0, Status: entity.InvoicePaid, ExternalRef: "INV-202605-002", IssueDate: timeMonth2Issue, DueDate: timeMonth2Due},

		// ครัวเรือน 3
		{HouseHoldID: 3, WaterReadingID: uintPointer(5), GarbageReadingID: uintPointer(5), TotalAmount: 530.0, Status: entity.InvoicePaid, ExternalRef: "INV-202604-003", IssueDate: timeMonth1Issue, DueDate: timeMonth1Due},
		{HouseHoldID: 3, WaterReadingID: uintPointer(6), GarbageReadingID: uintPointer(6), TotalAmount: 318.5, Status: entity.InvoicePending, ExternalRef: "INV-202605-003", IssueDate: timeMonth2Issue, DueDate: timeMonth2Due},

		// ครัวเรือน 4
		{HouseHoldID: 4, WaterReadingID: uintPointer(7), GarbageReadingID: uintPointer(7), TotalAmount: 285.0, Status: entity.InvoicePending, ExternalRef: "INV-202604-004", IssueDate: timeMonth1Issue, DueDate: timeMonth1Due},
		{HouseHoldID: 4, WaterReadingID: uintPointer(8), GarbageReadingID: uintPointer(8), TotalAmount: 95.0, Status: entity.InvoicePending, ExternalRef: "INV-202605-004", IssueDate: timeMonth2Issue, DueDate: timeMonth2Due},

		// ครัวเรือน 5
		{HouseHoldID: 5, WaterReadingID: uintPointer(9), GarbageReadingID: uintPointer(9), TotalAmount: 90.0, Status: entity.InvoicePending, ExternalRef: "INV-202604-005", IssueDate: timeMonth1Issue, DueDate: timeMonth1Due},
		{HouseHoldID: 5, WaterReadingID: uintPointer(10), GarbageReadingID: uintPointer(10), TotalAmount: 171.5, Status: entity.InvoicePending, ExternalRef: "INV-202605-005", IssueDate: timeMonth2Issue, DueDate: timeMonth2Due},
	}

	for _, inv := range invoices {
		if err := db.Create(&inv).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded invoices successfully (10 ใบแจ้งหนี้)")
	return nil
}

func uintPointer(v uint) *uint {
	return &v
}
