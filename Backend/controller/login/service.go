package login

import (
	"backend/entity"
	"backend/utils"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	WebLogin(username, password string) (string, string, string, error)
}

type authService struct {
	repo UserRepository
}

func NewAuthService(r UserRepository) AuthService {
	return &authService{repo: r}
}

func (s *authService) WebLogin(username, password string) (string, string, string, error) {
	// 1. ดึงข้อมูลผู้ใช้งานจาก Username
	user, err := s.repo.GetUserByUsername(username)
	if err != nil {
		return "", "", "", err
	}

	// 2. ตรวจสอบรหัสผ่าน
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", "", "", errors.New("รหัสผ่านไม่ถูกต้อง")
	}

	// 3. ป้องกันไม่ให้พนักงานภาคสนาม (Field Staff) มาล็อกอินบนเว็บระบบหลังบ้านหลัก
	if user.Role == entity.RoleFieldStaff {
		return "", "", "", errors.New("บัญชีนี้สำหรับใช้งานบนแอปพลิเคชันมือถือเท่านั้น")
	}

	// 4. ตรวจสอบสถานะการใช้งาน
	if user.Status != entity.StatusActive {
		return "", "", "", errors.New("บัญชีผู้ใช้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ")
	}

	// 5. ออก JWT Token
	token, err := utils.GenerateJWT(int(user.ID), user.Username, int(user.SubdistrictID), string(user.Role))
	if err != nil {
		return "", "", "", err
	}

	// 6. ดึงชื่อผู้ใช้งาน
	name := "ไม่ระบุชื่อ"
	if len(user.Staffs) > 0 {
		name = string(user.Staffs[0].TitleName) + user.Staffs[0].FirstName + " " + user.Staffs[0].LastName
	} else if len(user.HouseHolds) > 0 {
		name = string(user.HouseHolds[0].TitleName) + user.HouseHolds[0].FirstName + " " + user.HouseHolds[0].LastName
	}

	return token, string(user.Role), name, nil
}
