package household_account

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// HouseholdAccountWebHandler จัดการ API เส้นทางต่างๆ สำหรับบัญชีครัวเรือนบนเว็บ
type HouseholdAccountWebHandler struct {
	service HouseholdAccountService
}

// NewHouseholdAccountWebHandler สร้าง Instance ใหม่ของ Handler
func NewHouseholdAccountWebHandler(service HouseholdAccountService) *HouseholdAccountWebHandler {
	return &HouseholdAccountWebHandler{service: service}
}



// UpdateHouseholdProfile รับ Request อัปเดตข้อมูลโปรไฟล์บัญชีครัวเรือน
func (h *HouseholdAccountWebHandler) UpdateHouseholdProfile(c *gin.Context) {
	// ดึง ID จาก URL param แทน Token ชั่วคราว (เพื่อรองรับการ Test แบบ Mock ID ฝั่ง Frontend)
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบรหัสครัวเรือน"})
		return
	}

	// แปลงเป็น uint
	var householdID uint
	if _, err := fmt.Sscanf(idStr, "%d", &householdID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบรหัสครัวเรือนไม่ถูกต้อง"})
		return
	}

	var req UpdateHouseholdProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}

	// เรียกใช้ Service สำหรับอัปเดตข้อมูล (ส่ง householdID ไปให้ service)
	err := h.service.UpdateProfile(householdID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูลสำเร็จ"})
}
