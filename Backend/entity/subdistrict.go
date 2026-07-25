package entity

import (
	"gorm.io/gorm"
)

type Subdistrict struct {
	gorm.Model

	DistrictID uint      `gorm:"not null" json:"district_id" valid:"required~District ID is required"`
	District   *District `gorm:"foreignKey:DistrictID"`

	SubdistrictName string `gorm:"type:varchar(255);not null" json:"subdistrict_name" valid:"required~Subdistrict Name is required"`

	// Office Address Info
	AddressNumber string   `gorm:"type:varchar(50)" json:"address_number"`
	VillageID     *uint    `json:"village_id"`

	// Relationships
	Villages         []Village         `gorm:"foreignKey:SubdistrictID"`
	Logins           []Login           `gorm:"foreignKey:SubdistrictID"`
	WaterUnits       []WaterUnit       `gorm:"foreignKey:SubdistrictID"`
	GarbageSizeCosts []GarbageSizeCost `gorm:"foreignKey:SubdistrictID"`
	SubdistrictInfo  *SubdistrictInfo  `gorm:"foreignKey:SubdistrictID"`
}

