package entity

import (
	"gorm.io/gorm"
)

type VillageDetail struct {
	gorm.Model

	VillageID uint      `gorm:"uniqueIndex;not null" json:"village_id" valid:"required~Village ID is required"`
	Village   *Village  `gorm:"foreignKey:VillageID"`
	TitleName TitleName `gorm:"type:varchar(255);not null" json:"title_name" valid:"required~Title Name is required"`

	HeadmanFirstname   string `gorm:"type:varchar(255);not null" json:"headman_firstname" valid:"required~Headman Firstname is required"`
	HeadmanLastname    string `gorm:"type:varchar(255);not null" json:"headman_lastname" valid:"required~Headman Lastname is required"`
	NumberHouse        int    `gorm:"not null" json:"number_house" valid:"required~Number House is required"`
	HeadmanPhoneNumber string `gorm:"type:varchar(10);not null;unique" json:"headman_phone_number" valid:"required~Headman Phone Number is required,stringlength(10|10)~Phone Number must be 10 digits"`
}
