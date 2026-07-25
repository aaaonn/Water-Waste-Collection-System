package household_account

import (
	"errors"
	"golang.org/x/crypto/bcrypt"
)

// HouseholdAccountService Interface สำหรับให้บริการระบบบัญชีครัวเรือน
type HouseholdAccountService interface {
	UpdateProfile(householdID uint, req UpdateHouseholdProfileRequest) error
}

type householdAccountService struct {
	repo HouseholdAccountRepository
}

// NewHouseholdAccountService สร้าง Instance ใหม่ของ Service
func NewHouseholdAccountService(repo HouseholdAccountRepository) HouseholdAccountService {
	return &householdAccountService{repo: repo}
}

// UpdateProfile ให้บริการอัปเดตข้อมูลบัญชีครัวเรือน (เบอร์โทร และ/หรือ รหัสผ่าน)
func (s *householdAccountService) UpdateProfile(householdID uint, req UpdateHouseholdProfileRequest) error {
	// 1. ดึงข้อมูล household เดิม
	household, err := s.repo.GetHouseholdByID(householdID)
	if err != nil {
		return errors.New("ไม่พบข้อมูลบัญชีของท่าน")
	}

	// 2. อัปเดตเบอร์โทรศัพท์ (ถ้ามีการส่งมา)
	if req.PhoneNumber != "" {
		if len(req.PhoneNumber) != 10 {
			return errors.New("เบอร์โทรศัพท์ต้องมีความยาว 10 หลัก")
		}
		err = s.repo.UpdatePhoneNumber(household.ID, req.PhoneNumber)
		if err != nil {
			return errors.New("ไม่สามารถอัปเดตเบอร์โทรศัพท์ได้")
		}
	}

	// 3. อัปเดตรหัสผ่าน (ถ้ามีการส่งรหัสผ่านเดิมและรหัสผ่านใหม่มา)
	if req.OldPassword != "" && req.NewPassword != "" {
		loginInfo, err := s.repo.GetLoginByID(household.LoginID)
		if err != nil {
			return errors.New("ไม่พบข้อมูลเข้าระบบ")
		}

		// ตรวจสอบรหัสผ่านเดิม
		err = bcrypt.CompareHashAndPassword([]byte(loginInfo.PasswordHash), []byte(req.OldPassword))
		if err != nil {
			return errors.New("รหัสผ่านเดิมไม่ถูกต้อง")
		}

		// เข้ารหัสรหัสผ่านใหม่
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			return errors.New("เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่านใหม่")
		}

		// บันทึกรหัสผ่านใหม่
		err = s.repo.UpdatePassword(household.LoginID, string(hashedPassword))
		if err != nil {
			return errors.New("ไม่สามารถอัปเดตรหัสผ่านได้")
		}
	} else if req.OldPassword != "" || req.NewPassword != "" {
		return errors.New("กรุณากรอกทั้งรหัสผ่านเดิมและรหัสผ่านใหม่ให้ครบถ้วน")
	}

	return nil
}
