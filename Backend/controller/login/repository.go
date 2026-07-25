package login

import (
	"backend/entity"
	"errors"

	"gorm.io/gorm"
)

type UserRepository interface {
	GetUserByUsername(username string) (*entity.Login, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetUserByUsername(username string) (*entity.Login, error) {
	var user entity.Login
	err := r.db.Preload("Staffs").Preload("HouseHolds").Where("username = ?", username).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("ไม่พบชื่อผู้ใช้งานนี้ในระบบ")
		}
		return nil, err
	}
	return &user, nil
}
