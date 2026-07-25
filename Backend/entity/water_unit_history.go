package entity

import (
	"gorm.io/gorm"
)

type WaterUnitHistory struct {
	gorm.Model

	SubdistrictID uint         `gorm:"not null" json:"subdistrict_id"`
	Subdistrict   *Subdistrict `gorm:"foreignKey:SubdistrictID"`

	StartUnit float64  `gorm:"not null" json:"start_unit"`
	EndUnit   *float64 `json:"end_unit"`
	Cost      float64  `gorm:"not null" json:"cost"`
	Month     int      `gorm:"not null" json:"month"`
	Year      int      `gorm:"not null" json:"year"`
}
