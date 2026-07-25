package household_account


// UpdateHouseholdProfileRequest DTO สำหรับรับข้อมูลอัปเดตโปรไฟล์จากหน้าเว็บ
type UpdateHouseholdProfileRequest struct {
	PhoneNumber string `json:"phone_number"`
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}
