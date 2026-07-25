package entity

import (
	"gorm.io/gorm"
)

type HouseHold struct {
	gorm.Model

	VillageID uint     `gorm:"not null" json:"village_id" valid:"required~Village ID is required"`
	Village   *Village `gorm:"foreignKey:VillageID"`

	LoginID uint   `gorm:"uniqueIndex;not null" json:"login_id" valid:"required~Login ID is required"`
	Login   *Login `gorm:"foreignKey:LoginID"`

	WaterStatus   UserStatus       `gorm:"type:varchar(50);not null" json:"water_status" valid:"required~Water Status is required"`
	GarbageStatus UserStatus       `gorm:"type:varchar(50);not null" json:"garbage_status" valid:"required~Garbage Status is required"`

	HouseNumber string    `gorm:"type:varchar(50);not null" json:"house_number" valid:"required~House Number is required"`
	HouseCode   string    `gorm:"uniqueIndex;type:varchar(255);not null" json:"house_code" valid:"required~House Code is required"`
	TitleName   TitleName `gorm:"type:varchar(255);not null" json:"title_name" valid:"required~Title Name is required"`
	FirstName   string    `gorm:"type:varchar(255);not null" json:"first_name" valid:"required~First Name is required"`
	LastName    string    `gorm:"type:varchar(255);not null" json:"last_name" valid:"required~Last Name is required"`
	PhoneNumber string    `gorm:"type:varchar(10);not null" json:"phone_number" valid:"required~Phone Number is required,stringlength(10|10)~Phone Number must be 10 digits"`
	CitizenID   string    `gorm:"type:varchar(13);not null" json:"citizen_id" valid:"required~Citizen ID is required,stringlength(13|13)~Citizen ID must be 13 digits"`
	WaterUserID string    `gorm:"uniqueIndex;type:varchar(50);not null" json:"water_user_id" valid:"required~Water User ID is required"`

	// Relationships
	Invoices        []Invoice        `gorm:"foreignKey:HouseHoldID"`
	WaterReadings   []WaterReading   `gorm:"foreignKey:HouseHoldID"`
	GarbageReadings []GarbageReading `gorm:"foreignKey:HouseHoldID"`
}
