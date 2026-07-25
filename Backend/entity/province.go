package entity

import (
	"gorm.io/gorm"
)

type Province struct {
	gorm.Model

	ProvinceName string `gorm:"type:varchar(255);not null" json:"province_name" valid:"required~Province Name is required"`

	// Relationships
	Districts []District `gorm:"foreignKey:ProvinceID"`
}
