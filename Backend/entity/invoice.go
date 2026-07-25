package entity

import (
	"time"

	"gorm.io/gorm"
)

type Invoice struct {
	gorm.Model

	HouseHoldID uint       `gorm:"not null" json:"household_id" valid:"required~Household ID is required"`
	HouseHold   *HouseHold `gorm:"foreignKey:HouseHoldID"`

	Status InvoiceStatus `gorm:"type:varchar(50);not null" json:"status" valid:"required~Status is required"`

	WaterReadingID *uint          `json:"water_reading_id"`
	WaterReading   *WaterReading `gorm:"foreignKey:WaterReadingID"`

	GarbageReadingID *uint            `json:"garbage_reading_id"`
	GarbageReading   *GarbageReading `gorm:"foreignKey:GarbageReadingID"`

	ExternalRef string    `gorm:"type:varchar(255)" json:"external_ref"`
	TotalAmount float64   `gorm:"not null" json:"total_amount" valid:"required~Total Amount is required"`
	IssueDate   time.Time `gorm:"not null" json:"issue_date" valid:"required~Issue Date is required"`
	DueDate     time.Time `gorm:"not null" json:"due_date" valid:"required~Due Date is required"`

	// Relationships
	PaymentTransactions []PaymentTransaction `gorm:"foreignKey:InvoiceID"`
}
