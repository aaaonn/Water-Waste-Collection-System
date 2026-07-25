package invoice_and_receipt

import (
	"time"
)

type MobileInvoiceReceiptResponse struct {
	ID            uint                 `json:"id"`
	InvoiceID     uint                 `json:"invoice_id"`
	VillageID     uint                 `json:"village_id"`
	Status        string               `json:"status"` // unpaid, paid
	ReceiptNumber string               `json:"receipt_number"`
	ReceiptDate   *time.Time           `json:"receipt_date"`
	PaidAt        *time.Time           `json:"paid_at"`
	PaymentMethod *string              `json:"payment_method"`
	TotalAmount   float64              `json:"total_amount"`
	BillMonth     string               `json:"bill_month"`
	QRCodeURL     string               `json:"qr_code_url"`

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
