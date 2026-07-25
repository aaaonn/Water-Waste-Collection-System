package entity

import (
	"gorm.io/gorm"
)

type WaterUnit struct {
	gorm.Model

	SubdistrictID uint         `gorm:"not null" json:"subdistrict_id" valid:"required~Subdistrict ID is required"`
	Subdistrict   *Subdistrict `gorm:"foreignKey:SubdistrictID"`

	StartUnit float64 `gorm:"not null" json:"start_unit" valid:"required~Start Unit is required"`
	EndUnit   *float64 `json:"end_unit"`
	Cost      float64 `gorm:"not null" json:"cost" valid:"required~Cost is required"`
}
