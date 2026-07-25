package entity

import (
	"gorm.io/gorm"
)

// SubdistrictInfo เก็บข้อมูลส่วนขยายของตำบล เช่น ข้อมูลนายกองค์การบริหารส่วนตำบล
type SubdistrictInfo struct {
	gorm.Model

	SubdistrictID uint         `gorm:"uniqueIndex;not null" json:"subdistrict_id" valid:"required~Subdistrict ID is required"`
	Subdistrict   *Subdistrict `gorm:"foreignKey:SubdistrictID"`

	// Mayor Info
	TitleName   TitleName `gorm:"type:varchar(255);not null" json:"title_name" valid:"required~Title Name is required"`
	FirstName   string    `gorm:"type:varchar(255);not null" json:"first_name" valid:"required~First Name is required"`
	LastName    string    `gorm:"type:varchar(255);not null" json:"last_name" valid:"required~Last Name is required"`
	PhoneNumber string    `gorm:"type:varchar(10);not null" json:"phone_number" valid:"required~Phone Number is required,stringlength(10|10)~Phone Number must be 10 digits"`
}
