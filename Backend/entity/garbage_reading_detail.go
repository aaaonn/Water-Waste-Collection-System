package entity

import (
	"gorm.io/gorm"
)

type GarbageReadingDetail struct {
	gorm.Model

	GarbageReadingID uint            `gorm:"not null" json:"garbage_reading_id" valid:"required~Garbage Reading ID is required"`
	GarbageReading   *GarbageReading `gorm:"foreignKey:GarbageReadingID"`

	GarbageSizeID uint             `gorm:"not null" json:"garbage_size_id" valid:"required~Garbage Size ID is required"`
	GarbageSize   *GarbageSizeCost `gorm:"foreignKey:GarbageSizeID"`

	Amount int `gorm:"not null" json:"amount" valid:"required~Amount is required"`
}
