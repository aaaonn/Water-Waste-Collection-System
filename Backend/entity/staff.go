package entity

import (
	"gorm.io/gorm"
)

type Staff struct {
	gorm.Model

	UserID uint   `gorm:"not null" json:"user_id" valid:"required~User ID is required"`
	User   *Login `gorm:"foreignKey:UserID"`

	TitleName   TitleName `gorm:"type:varchar(255);not null" json:"title_name" valid:"required~Title Name is required"`
	FirstName   string    `gorm:"type:varchar(255);not null" json:"first_name" valid:"required~First Name is required"`
	LastName    string    `gorm:"type:varchar(255);not null" json:"last_name" valid:"required~Last Name is required"`
	PhoneNumber string    `gorm:"type:varchar(10);not null" json:"phone_number" valid:"required~Phone Number is required,stringlength(10|10)~Phone Number must be 10 digits"`

	// Relationships
	WaterReadings       []WaterReading       `gorm:"foreignKey:StaffID"`
	GarbageReadings     []GarbageReading     `gorm:"foreignKey:StaffID"`
	PaymentTransactions []PaymentTransaction `gorm:"foreignKey:StaffID"`
}
