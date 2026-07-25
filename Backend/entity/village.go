package entity

import (
	"gorm.io/gorm"
)

type Village struct {
	gorm.Model

	SubdistrictID uint         `gorm:"not null" json:"subdistrict_id" valid:"required~Subdistrict ID is required"`
	Subdistrict   *Subdistrict `gorm:"foreignKey:SubdistrictID"`

	VillageName   string `gorm:"type:varchar(255);not null" json:"village_name" valid:"required~Village Name is required"`
	VillageNumber int    `gorm:"not null" json:"village_number" valid:"required~Village Number is required"`

	// Relationships
	VillageDetail *VillageDetail `gorm:"foreignKey:VillageID"`
	HouseHolds    []HouseHold    `gorm:"foreignKey:VillageID"`
}
