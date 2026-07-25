package entity

import (
	"gorm.io/gorm"
)

type GarbageSizeCost struct {
	gorm.Model

	SubdistrictID uint         `gorm:"not null" json:"subdistrict_id" valid:"required~Subdistrict ID is required"`
	Subdistrict   *Subdistrict `gorm:"foreignKey:SubdistrictID"`

	SizeName string  `gorm:"type:varchar(255);not null" json:"size_name" valid:"required~Size Name is required"`
	Cost     float64 `gorm:"not null" json:"cost" valid:"required~Cost is required"`

	// Relationships
	GarbageReadingDetails []GarbageReadingDetail `gorm:"foreignKey:GarbageSizeID"`
}
