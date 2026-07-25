package userstaff

import (
	"backend/entity"
)

// CreateUserstaffRequest DTO สำหรับสร้างพนักงาน/แอดมินใหม่
type CreateUserstaffRequest struct {
	Username    string            `json:"username" binding:"required"`
	Password    string            `json:"password" binding:"required"`
	Role        entity.Role       `json:"role" binding:"required"`
	Status      *entity.UserStatus `json:"status,omitempty"` // สามารถกำหนด status ตอนสร้างได้
	TitleName   entity.TitleName  `json:"title_name" binding:"required"`
	FirstName   string            `json:"first_name" binding:"required"`
	LastName    string            `json:"last_name" binding:"required"`
	PhoneNumber string            `json:"phone_number" binding:"required,len=10"`
}

// UpdateUserstaffRequest DTO สำหรับอัปเดตข้อมูลพนักงาน/แอดมิน (สามารถอัปเดตรหัสผ่านได้ถ้าส่งมา)
type UpdateUserstaffRequest struct {
	Password    *string           `json:"password,omitempty"`
	Role        *entity.Role      `json:"role,omitempty"`
	Status      *entity.UserStatus `json:"status,omitempty"`
	TitleName   *entity.TitleName `json:"title_name,omitempty"`
	FirstName   *string           `json:"first_name,omitempty"`
	LastName    *string           `json:"last_name,omitempty"`
	PhoneNumber *string           `json:"phone_number,omitempty" binding:"omitempty,len=10"`
}

// UserstaffResponse DTO สำหรับตอบกลับข้อมูลผู้ใช้
type UserstaffResponse struct {
	ID          uint              `json:"id"`
	UserID      uint              `json:"user_id"` // Login ID
	Username    string            `json:"username"`
	Role        entity.Role       `json:"role"`
	Status      entity.UserStatus `json:"status"`
	TitleName   string            `json:"title_name"`
	FirstName   string            `json:"first_name"`
	LastName    string            `json:"last_name"`
	PhoneNumber string            `json:"phone_number"`
}

// ToUserstaffResponse แปลง Entity เป็น Response DTO โดยรวมข้อมูล Login และ Staff
func ToUserstaffResponse(login *entity.Login, staff *entity.Staff) UserstaffResponse {
	return UserstaffResponse{
		ID:          staff.ID,
		UserID:      login.ID,
		Username:    login.Username,
		Role:        login.Role,
		Status:      login.Status,
		TitleName:   string(staff.TitleName),
		FirstName:   staff.FirstName,
		LastName:    staff.LastName,
		PhoneNumber: staff.PhoneNumber,
	}
}
