package entity

import (
	"gorm.io/gorm"
)

type District struct {
	gorm.Model

	ProvinceID uint      `gorm:"not null" json:"province_id" valid:"required~Province ID is required"`
	Province   *Province `gorm:"foreignKey:ProvinceID"`

	DistrictName string `gorm:"type:varchar(255);not null" json:"district_name" valid:"required~District Name is required"`

	// Relationships
	Subdistricts []Subdistrict `gorm:"foreignKey:DistrictID"`
}
