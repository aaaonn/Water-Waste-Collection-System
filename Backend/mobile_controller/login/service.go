package login

import (
	"backend/entity"
	"backend/utils"
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

type ProfileResponse struct {
	OwnerName       string `json:"owner_name"`
	Position        string `json:"position"`
	SubdistrictName string `json:"subdistrict_name"`
	DistrictName    string `json:"district_name"`
	ProvinceName    string `json:"province_name"`
}

type AuthService interface {
	Login(username, password string) (string, error)
	GetProfile(userID uint) (*ProfileResponse, error)
}

type authService struct {
	repo UserRepository
}

func NewAuthService(r UserRepository) AuthService {
	return &authService{repo: r}
}

func (s *authService) Login(username, password string) (string, error) {
	// 1. ดึงข้อมูลผู้ใช้งานมาจากชั้น Repository
	user, err := s.repo.GetUserByUsername(username)
	if err != nil {
		return "", err
	}

	// 2. ตรวจสอบรหัสผ่าน (Business Logic)
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", errors.New("รหัสผ่านไม่ถูกต้อง")
	}

	if user.Role != entity.RoleFieldStaff {
		return "", errors.New("คุณไม่มีสิทธิ์ในการเข้าถึงระบบ")
	}

	if user.Status != entity.StatusActive {
		return "", errors.New("บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบ")
	}

	// สร้าง JWT Token
	token, err := utils.GenerateJWT(int(user.ID), user.Username, int(user.SubdistrictID), string(user.Role))
	if err != nil {
		return "", err
	}
	return token, nil
}

func (s *authService) GetProfile(userID uint) (*ProfileResponse, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	resp := &ProfileResponse{}

	// 1. ดึงข้อมูลที่อยู่ อบต. อำเภอ และ จังหวัด
	if user.Subdistrict != nil {
		resp.SubdistrictName = user.Subdistrict.SubdistrictName
		if user.Subdistrict.District != nil {
			resp.DistrictName = user.Subdistrict.District.DistrictName
			if user.Subdistrict.District.Province != nil {
				resp.ProvinceName = user.Subdistrict.District.Province.ProvinceName
			}
		}
	}

	// 2. ดึงข้อมูลส่วนตัวพนักงาน ประกอบชื่อ-นามสกุลเต็ม
	if len(user.Staffs) > 0 {
		resp.OwnerName = fmt.Sprintf("%s%s %s", user.Staffs[0].TitleName, user.Staffs[0].FirstName, user.Staffs[0].LastName)
	}

	// 3. กำหนดค่าตำแหน่งตามสิทธิ์การใช้งาน
	switch user.Role {
	case entity.RoleFieldStaff:
		resp.Position = "พนักงานสำรวจจัดเก็บรายได้"
	case entity.RoleAdmin:
		resp.Position = "ผู้ดูแลระบบ"
	default:
		resp.Position = "พนักงานทั่วไป"
	}

	return resp, nil
}
