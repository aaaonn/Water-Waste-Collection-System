package entity

import (
	"gorm.io/gorm"
)

type Login struct {
	gorm.Model

	SubdistrictID uint         `gorm:"not null" json:"subdistrict_id" valid:"required~Subdistrict ID is required"`
	Subdistrict   *Subdistrict `gorm:"foreignKey:SubdistrictID"`

	Role   Role       `gorm:"type:varchar(50);not null" json:"role" valid:"required~Role is required"`
	Status UserStatus `gorm:"type:varchar(50);not null" json:"status" valid:"required~Status is required"`

	Username     string `gorm:"type:varchar(255);uniqueIndex;not null" json:"username" valid:"required~Username is required"`
	PasswordHash string `gorm:"type:text;not null" json:"password_hash" valid:"required~Password Hash is required"`

	// Relationships
	Staffs     []Staff     `gorm:"foreignKey:UserID"`
	HouseHolds []HouseHold `gorm:"foreignKey:LoginID"`
}
