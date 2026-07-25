package entity

import (
	"time"

	"gorm.io/gorm"
)

type PaymentTransaction struct {
	gorm.Model

	InvoiceID uint     `gorm:"not null" json:"invoice_id" valid:"required~Invoice ID is required"`
	Invoice   *Invoice `gorm:"foreignKey:InvoiceID"`

	OmiseTransactionID string `gorm:"type:varchar(255)" json:"omise_transaction_id"`

	PaymentMethod PaymentMethod `gorm:"type:varchar(50);not null" json:"payment_method" valid:"required~Payment Method is required"`
	PaymentStatus PaymentStatus `gorm:"type:varchar(50);not null" json:"payment_status" valid:"required~Payment Status is required"`

	// StaffID can be null if paid online via QR code
	StaffID *uint  `json:"staff_id"`
	Staff   *Staff `gorm:"foreignKey:StaffID"`

	QRCodeURL          string     `gorm:"type:varchar(555)" json:"qr_code_url"`
	ReceiptNumber      string     `gorm:"type:varchar(100);index" json:"receipt_number"`
	ExternalRef        string     `gorm:"type:varchar(255)" json:"external_ref"`
	RawGatewayResponse string     `gorm:"type:text" json:"raw_gateway_response"`
	Currency           string     `gorm:"type:varchar(10);default:'THB';not null" json:"currency" valid:"required~Currency is required"`
	PaidAt             *time.Time `json:"paid_at"`
}
