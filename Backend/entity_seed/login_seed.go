package entity_seed

import (
	"log"

	"backend/entity"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedLogins เพิ่มข้อมูลบัญชีเข้าระบบ 10 บัญชี (รหัสผ่าน 123456 ทุกตัว)
func SeedLogins(db *gorm.DB) error {
	var count int64
	db.Model(&entity.Login{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] Logins table already has data, skipping...")
		return nil
	}

	// แฮชรหัสผ่าน 123456 เพื่อความปลอดภัยระดับฐานข้อมูล
	hashedByte, err := bcrypt.GenerateFromPassword([]byte("123456"), 10)
	if err != nil {
		return err
	}
	hash := string(hashedByte)

	logins := []entity.Login{
		// 1 Admin
		{SubdistrictID: 1, Username: "admin1", PasswordHash: hash, Role: entity.RoleAdmin, Status: entity.StatusActive},
		// 2 Staffs
		{SubdistrictID: 1, Username: "staff1", PasswordHash: hash, Role: entity.RoleStaff, Status: entity.StatusActive},
		{SubdistrictID: 1, Username: "staff2", PasswordHash: hash, Role: entity.RoleStaff, Status: entity.StatusActive},
		// 2 FieldStaffs
		{SubdistrictID: 1, Username: "field1", PasswordHash: hash, Role: entity.RoleFieldStaff, Status: entity.StatusActive},
		{SubdistrictID: 1, Username: "field2", PasswordHash: hash, Role: entity.RoleFieldStaff, Status: entity.StatusActive},
		// 5 Households
		{SubdistrictID: 1, Username: "user1", PasswordHash: hash, Role: entity.RoleHousehold, Status: entity.StatusActive},
		{SubdistrictID: 1, Username: "user2", PasswordHash: hash, Role: entity.RoleHousehold, Status: entity.StatusActive},
		{SubdistrictID: 1, Username: "user3", PasswordHash: hash, Role: entity.RoleHousehold, Status: entity.StatusActive},
		{SubdistrictID: 1, Username: "user4", PasswordHash: hash, Role: entity.RoleHousehold, Status: entity.StatusActive},
		{SubdistrictID: 1, Username: "user5", PasswordHash: hash, Role: entity.RoleHousehold, Status: entity.StatusActive},
		// 1 Super Admin
		{SubdistrictID: 1, Username: "super_admin1", PasswordHash: hash, Role: entity.RoleSuperAdmin, Status: entity.StatusActive},
	}

	for _, l := range logins {
		if err := db.Create(&l).Error; err != nil {
			return err
		}
	}
	log.Println("[Seed] Seeded logins successfully (11 บัญชีผู้ใช้งาน)")
	return nil
}
