package entity

import (
	"time"

	"gorm.io/gorm"
)

type WaterReading struct {
	gorm.Model

	HouseHoldID uint       `gorm:"not null" json:"household_id" valid:"required~Household ID is required"`
	HouseHold   *HouseHold `gorm:"foreignKey:HouseHoldID"`

	StaffID uint   `gorm:"not null" json:"staff_id" valid:"required~Staff ID is required"`
	Staff   *Staff `gorm:"foreignKey:StaffID"`

	PrevReading  float64   `gorm:"not null" json:"prev_reading" valid:"required~Previous Reading is required"`
	CurrReading  float64   `gorm:"not null" json:"curr_reading" valid:"required~Current Reading is required"`
	UnitConsumed float64   `gorm:"not null" json:"unit_consumed" valid:"required~Unit Consumed is required"`
	ReadingDate  time.Time `gorm:"not null" json:"reading_date" valid:"required~Reading Date is required"`
	TotalAmount  float64   `gorm:"not null" json:"total_amount" valid:"required~Total Amount is required"`

	// Relationships
	Invoice *Invoice `gorm:"foreignKey:WaterReadingID"`
}
