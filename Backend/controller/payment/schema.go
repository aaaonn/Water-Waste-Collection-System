package payment

import (
	"time"
	"backend/entity"
)

type CreatePromptPayRequest struct {
	InvoiceID uint `json:"invoice_id" binding:"required"`
}

type PromptPayResponse struct {
	TransactionID string     `json:"transaction_id"`
	InvoiceID     uint       `json:"invoice_id"`
	Amount        float64    `json:"amount"`
	Currency      string     `json:"currency"`
	QRCodeURL     string     `json:"qr_code_url"`
	Status        string     `json:"status"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
}

type CreateCashPaymentRequest struct {
	InvoiceID uint `json:"invoice_id" binding:"required"`
}

type CashPaymentResponse struct {
	InvoiceID     uint       `json:"invoice_id"`
	Amount        float64    `json:"amount"`
	Currency      string     `json:"currency"`
	Status        string     `json:"status"`
	PaidAt        *time.Time `json:"paid_at"`
	StaffID       uint       `json:"staff_id"`
}


type PaymentStatusResponse struct {
	InvoiceID     uint       `json:"invoice_id"`
	TransactionID string     `json:"transaction_id,omitempty"`
	Status        string     `json:"status"`
	Method        string     `json:"method,omitempty"`
	PaidAt        *time.Time `json:"paid_at,omitempty"`
}

// PaymentResponse กำหนดโครงสร้างข้อมูลที่จะส่งกลับหน้า Dashboard สำหรับประวัติชำระเงิน
type PaymentResponse struct {
	ID                 uint                 `json:"id"`
	InvoiceID          uint                 `json:"invoice_id"`
	OmiseTransactionID string               `json:"omise_transaction_id"`
	PaymentMethod      entity.PaymentMethod `json:"payment_method"`
	PaymentStatus      entity.PaymentStatus `json:"payment_status"`
	QRCodeURL          string               `json:"qr_code_url"`
	ReceiptNumber      string               `json:"receipt_number"`
	ExternalRef        string               `json:"external_ref"`
	Currency           string               `json:"currency"`
	PaidAt             *time.Time           `json:"paid_at"`

	// Preloaded invoice data (ดึงข้อมูลบิลมาแสดงร่วมด้วย)
	InvoiceStatus      entity.InvoiceStatus `json:"invoice_status"`
	InvoiceAmount      float64              `json:"invoice_amount"`
	InvoiceIssueDate   time.Time            `json:"invoice_issue_date"`
	
	// Preloaded water reading data from invoice (ดึงข้อมูลหน่วยน้ำที่ผูกกับบิลมาแสดง)
	WaterUnitConsumed  float64              `json:"water_unit_consumed"`  // หน่วยน้ำที่ใช้ไป
	WaterPrevReading   float64              `json:"water_prev_reading"`   // เริ่มต้น
	WaterCurrReading   float64              `json:"water_curr_reading"`   // สิ้นสุด
	WaterReadingAmount float64              `json:"water_reading_amount"` // ยอดเงินค่าน้ำแยก
}

// ToPaymentResponse แปลง Entity เป็น Response ป้องกันไม่ให้ส่งข้อมูลที่ไม่จำเป็นกลับไป
func ToPaymentResponse(p *entity.PaymentTransaction) *PaymentResponse {
	if p == nil {
		return nil
	}
	
	res := &PaymentResponse{
		ID:                 p.ID,
		InvoiceID:          p.InvoiceID,
		OmiseTransactionID: p.OmiseTransactionID,
		PaymentMethod:      p.PaymentMethod,
		PaymentStatus:      p.PaymentStatus,
		QRCodeURL:          p.QRCodeURL,
		ReceiptNumber:      p.ReceiptNumber,
		ExternalRef:        p.ExternalRef,
		Currency:           p.Currency,
		PaidAt:             p.PaidAt,
	}

	// เช็คว่ามี Invoice ผูกอยู่ไหม ถ้ามีก็ดึงฟิลด์ต่างๆ มาใส่ response
	if p.Invoice != nil {
		res.InvoiceStatus = p.Invoice.Status
		res.InvoiceAmount = p.Invoice.TotalAmount
		res.InvoiceIssueDate = p.Invoice.IssueDate

		// เช็คอีกชั้นว่า Invoice มีการผูกกับ WaterReading ไว้ไหม
		if p.Invoice.WaterReading != nil {
			res.WaterUnitConsumed = p.Invoice.WaterReading.UnitConsumed
			res.WaterPrevReading = p.Invoice.WaterReading.PrevReading
			res.WaterCurrReading = p.Invoice.WaterReading.CurrReading
			res.WaterReadingAmount = p.Invoice.WaterReading.TotalAmount
		}
	}

	return res
}

// ToPaymentResponses สำหรับกรณีมีประวัติการชำระเงินหลายรายการ
func ToPaymentResponses(payments []entity.PaymentTransaction) []PaymentResponse {
	responses := make([]PaymentResponse, 0, len(payments))
	for _, p := range payments {
		res := ToPaymentResponse(&p)
		if res != nil {
			responses = append(responses, *res)
		}
	}
	return responses
}

type ReceiptResponse struct {
	ReceiptNumber string               `json:"receipt_number"`
	ReceiptDate   *time.Time           `json:"receipt_date"`
	PaidAt        *time.Time           `json:"paid_at"`
	PaymentMethod entity.PaymentMethod `json:"payment_method"`
	TotalAmount   float64              `json:"total_amount"`
	BillMonth     string               `json:"bill_month"`

	Organization struct {
		Name        string `json:"name"`
		Address     string `json:"address"`
		PhoneNumber string `json:"phone_number,omitempty"`
	} `json:"organization"`

	Household struct {
		WaterUserID   string `json:"water_user_id"`
		OwnerName     string `json:"owner_name"`
		HouseNumber   string `json:"house_number"`
		VillageName   string `json:"village_name"`
		VillageNumber int    `json:"village_number"`
		FullAddress   string `json:"full_address"`
	} `json:"household"`

	WaterUsage struct {
		PrevReadingValue float64    `json:"prev_reading_value"`
		CurrReadingValue float64    `json:"curr_reading_value"`
		UnitConsumed     float64    `json:"unit_consumed"`
		WaterBillAmount  float64    `json:"water_bill_amount"`
		StartDate        *time.Time `json:"start_date"`
		EndDate          *time.Time `json:"end_date"`
	} `json:"water_usage"`

	GarbageUsage struct {
		TotalAmount float64               `json:"total_amount"`
		Details     []GarbageDetailSchema `json:"details"`
	} `json:"garbage_usage"`

	StaffName string `json:"staff_name,omitempty"`
}

type GarbageDetailSchema struct {
	SizeName string  `json:"size_name"`
	Cost     float64 `json:"cost"`
	Amount   int     `json:"amount"`
}

