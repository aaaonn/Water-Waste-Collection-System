package login

import (
	"backend/entity"
	"errors"

	"gorm.io/gorm"
)

type UserRepository interface {
	GetUserByUsername(username string) (*entity.Login, error)
	GetUserByID(id uint) (*entity.Login, error)
}

// 2. เพิ่มฟิลด์ db เข้าไปใน struct เพื่อเอาไว้เรียกใช้ภายในแพ็กเกจนี้
type userRepository struct {
	db *gorm.DB
}

// 3. ปรับให้ฟังก์ชัน New รับ *gorm.DB เข้ามาจากข้างนอก (Container / Main)
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// 4. เปลี่ยนจากการดึงข้อมูลแบบจำลอง เป็นการยิง Query หาใน Database จริงๆ
func (r *userRepository) GetUserByUsername(username string) (*entity.Login, error) {
	var user entity.Login

	err := r.db.Where("username = ?", username).First(&user).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("ไม่พบผู้ใช้งาน")
		}
		return nil, err
	}

	return &user, nil
}

func (r *userRepository) GetUserByID(id uint) (*entity.Login, error) {
	var user entity.Login

	err := r.db.Preload("Subdistrict.District.Province").Preload("Staffs").First(&user, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("ไม่พบผู้ใช้งาน")
		}
		return nil, err
	}

	return &user, nil
}
