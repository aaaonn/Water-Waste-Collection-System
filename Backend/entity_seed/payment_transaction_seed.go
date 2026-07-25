package entity_seed

import (
	"log"
	"time"

	"backend/entity"

	"gorm.io/gorm"
)

// SeedPaymentTransactions เพิ่มรายการธุรกรรมการชำระเงินจำลอง 10 รายการ
func SeedPaymentTransactions(db *gorm.DB) error {
	var count int64
	db.Model(&entity.PaymentTransaction{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] PaymentTransactions table already has data, skipping...")
		return nil
	}

	timePaid1 := time.Date(2026, time.May, 1, 14, 25, 0, 0, time.Local)
	timePaid2 := time.Date(2026, time.June, 1, 15, 40, 0, 0, time.Local)

	// ฟังก์ชันตัวช่วยเพื่อแปลงเป็นพอยเตอร์ของ StaffID และ time
	staffIDPointer := func(id uint) *uint {
		return &id
	}
	timePointer := func(t time.Time) *time.Time {
		return &t
	}

	transactions := []entity.PaymentTransaction{
		// 3 รายการจ่ายผ่าน QR PromptPay สำเร็จ (สำหรับ Invoice 1, 2, 3)
		{InvoiceID: 1, OmiseTransactionID: "trx_qr_902318", PaymentMethod: entity.MethodQRPromptpay, PaymentStatus: entity.PaymentSuccess, StaffID: nil, QRCodeURL: "https://example.com/mock-qr-code.png", ReceiptNumber: "REC-20260501-000001", ExternalRef: "REF-QR-001", RawGatewayResponse: `{"status": "successful", "charge_id": "chg_902318"}`, Currency: "THB", PaidAt: timePointer(timePaid1)},
		{InvoiceID: 2, OmiseTransactionID: "trx_qr_902319", PaymentMethod: entity.MethodQRPromptpay, PaymentStatus: entity.PaymentSuccess, StaffID: nil, QRCodeURL: "https://example.com/mock-qr-code.png", ReceiptNumber: "REC-20260601-000002", ExternalRef: "REF-QR-002", RawGatewayResponse: `{"status": "successful", "charge_id": "chg_902319"}`, Currency: "THB", PaidAt: timePointer(timePaid2)},
		{InvoiceID: 3, OmiseTransactionID: "trx_qr_902320", PaymentMethod: entity.MethodQRPromptpay, PaymentStatus: entity.PaymentSuccess, StaffID: nil, QRCodeURL: "https://example.com/mock-qr-code.png", ReceiptNumber: "REC-20260501-000003", ExternalRef: "REF-QR-003", RawGatewayResponse: `{"status": "successful", "charge_id": "chg_902320"}`, Currency: "THB", PaidAt: timePointer(timePaid1)},

		// 2 รายการจ่ายเงินสดกับพนักงานเก็บเงินสำเร็จ (สำหรับ Invoice 4, 5)
		{InvoiceID: 4, OmiseTransactionID: "", PaymentMethod: entity.MethodCash, PaymentStatus: entity.PaymentSuccess, StaffID: staffIDPointer(4), QRCodeURL: "", ReceiptNumber: "REC-20260601-000004", ExternalRef: "REF-CASH-004", RawGatewayResponse: "Paid by cash to Somjitr Kidde", Currency: "THB", PaidAt: timePointer(timePaid2)},
		{InvoiceID: 5, OmiseTransactionID: "", PaymentMethod: entity.MethodCash, PaymentStatus: entity.PaymentSuccess, StaffID: staffIDPointer(4), QRCodeURL: "", ReceiptNumber: "REC-20260501-000005", ExternalRef: "REF-CASH-005", RawGatewayResponse: "Paid by cash to Somjitr Kidde", Currency: "THB", PaidAt: timePointer(timePaid1)},

		// 1 รายการกำลังทำรายการค้างจ่าย (สำหรับ Invoice 8)
		{InvoiceID: 8, OmiseTransactionID: "", PaymentMethod: entity.MethodQRPromptpay, PaymentStatus: entity.PaymentPending, StaffID: nil, QRCodeURL: "https://example.com/mock-qr-code-pending.png", ReceiptNumber: "", ExternalRef: "", RawGatewayResponse: `{"status": "pending"}`, Currency: "THB", PaidAt: nil},

		// 2 รายการลองจ่ายแล้วพัง/ล้มเหลว (สำหรับ Invoice 9, 10)
		{InvoiceID: 9, OmiseTransactionID: "trx_qr_failed_99", PaymentMethod: entity.MethodQRPromptpay, PaymentStatus: entity.PaymentFailed, StaffID: nil, QRCodeURL: "", ReceiptNumber: "", ExternalRef: "", RawGatewayResponse: `{"status": "failed", "failure_code": "insufficient_funds"}`, Currency: "THB", PaidAt: nil},
		{InvoiceID: 10, OmiseTransactionID: "trx_qr_failed_100", PaymentMethod: entity.MethodQRPromptpay, PaymentStatus: entity.PaymentFailed, StaffID: nil, QRCodeURL: "", ReceiptNumber: "", ExternalRef: "", RawGatewayResponse: `{"status": "failed", "failure_code": "expired_charge"}`, Currency: "THB", PaidAt: nil},
	}

	for _, tx := range transactions {
		if err := db.Create(&tx).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded payment transactions successfully (10 รายการธุรกรรม)")
	return nil
}
