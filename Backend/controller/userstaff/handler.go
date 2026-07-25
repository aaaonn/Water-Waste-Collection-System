package userstaff

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
)

// UserstaffHandler เป็น struct ที่เก็บ service เอาไว้ใช้งาน
type UserstaffHandler struct {
	service UserstaffService
}

// NewUserstaffHandler สร้าง instance ใหม่ของ UserstaffHandler
func NewUserstaffHandler(service UserstaffService) *UserstaffHandler {
	return &UserstaffHandler{service: service}
}

// GetAll ดึงข้อมูลพนักงานและแอดมินทั้งหมดในระบบ
// GET /api/userstaffs
func (h *UserstaffHandler) GetAll(c *gin.Context) {
	staffs, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, staffs)
}

// GetByID ดึงข้อมูลพนักงานหรือแอดมิน 1 คน ตาม ID
// GET /api/userstaffs/:id
func (h *UserstaffHandler) GetByID(c *gin.Context) {
	// ดึงค่า id จากพารามิเตอร์ของ URL
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	staff, err := h.service.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, staff)
}

// Create สร้างบัญชีผู้ใช้งานใหม่ (รับ Username/Password จากฟอร์ม)
// POST /api/userstaffs
func (h *UserstaffHandler) Create(c *gin.Context) {
	var req CreateUserstaffRequest
	// ผูกข้อมูล JSON ที่ส่งมากับ struct CreateUserstaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// พยายามอ่าน Role ของผู้ที่กำลังกดสร้าง (มาจาก Middleware หรือ Header สำหรับทดสอบ)
	requesterRole := ""
	if roleVal, exists := c.Get("role"); exists {
		requesterRole = roleVal.(string)
	} else {
		// ดึงจาก Header ชั่วคราวสำหรับการทดสอบผ่าน Bruno (ถ้าไม่มี Middleware ป้องกัน)
		requesterRole = c.GetHeader("X-Requester-Role")
	}

	// ถ้าไม่มีข้อมูล Role เลย ให้ Error ป้องกันไว้ก่อน
	if requesterRole == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Requester role is required (use X-Requester-Role header for testing)"})
		return
	}

	staff, err := h.service.Create(&req, requesterRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, staff)
}

// Update แก้ไขข้อมูลผู้ใช้งาน เช่น ชื่อ เบอร์โทร รหัสผ่าน สถานะ
// PATCH /api/userstaffs/:id
func (h *UserstaffHandler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var req UpdateUserstaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// พยายามอ่าน Role ของผู้ที่กำลังกดอัปเดต
	requesterRole := ""
	if roleVal, exists := c.Get("role"); exists {
		requesterRole = roleVal.(string)
	} else {
		requesterRole = c.GetHeader("X-Requester-Role")
	}

	if requesterRole == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Requester role is required (use X-Requester-Role header for testing)"})
		return
	}

	staff, err := h.service.Update(uint(id), &req, requesterRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, staff)
}

// Delete ปิดการใช้งานผู้ใช้งาน (Soft Delete เปลี่ยนสถานะเป็น Inactive)
// DELETE /api/userstaffs/:id
func (h *UserstaffHandler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	// พยายามอ่าน Role ของผู้ที่กำลังกดลบ
	requesterRole := ""
	if roleVal, exists := c.Get("role"); exists {
		requesterRole = roleVal.(string)
	} else {
		requesterRole = c.GetHeader("X-Requester-Role")
	}

	if requesterRole == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Requester role is required (use X-Requester-Role header for testing)"})
		return
	}

	if err := h.service.Delete(uint(id), requesterRole); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
