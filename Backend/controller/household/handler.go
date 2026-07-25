package household

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// HouseholdHandler ตัวควบคุม HTTP requests/responses สำหรับครัวเรือน
type HouseholdHandler struct {
	service HouseholdService
}

// NewHouseholdHandler สร้างอินสแตนซ์ของ Handler
func NewHouseholdHandler(s HouseholdService) *HouseholdHandler {
	return &HouseholdHandler{service: s}
}

// GetAll ดึงข้อมูลครัวเรือนทั้งหมด
// @Summary Get all households
// @Tags Household
// @Produce json
// @Success 200 {array} HouseholdResponse
// @Failure 500 {object} map[string]string
// @Router /api/households [get]
func (h *HouseholdHandler) GetAll(c *gin.Context) {
	households, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูลครัวเรือน: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, households)
}

// GetByID ดึงข้อมูลครัวเรือนเดี่ยวตาม ID
// @Summary Get a household by ID
// @Tags Household
// @Produce json
// @Param id path int true "Household ID"
// @Success 200 {object} HouseholdResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/households/{id} [get]
func (h *HouseholdHandler) GetByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัส ID รูปแบบไม่ถูกต้อง"})
		return
	}

	res, err := h.service.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// GetMe ดึงข้อมูลครัวเรือนของตัวเอง (จาก Token)
// @Summary Get a household by logged-in user
// @Tags Household
// @Produce json
// @Success 200 {object} HouseholdResponse
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/households/me [get]
func (h *HouseholdHandler) GetMe(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้งานในระบบ"})
		return
	}

	loginID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "รูปแบบรหัสผู้ใช้งานไม่ถูกต้อง"})
		return
	}

	res, err := h.service.GetByLoginID(loginID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลครัวเรือนของท่าน: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// GetByVillageID ดึงรายชื่อครัวเรือนแยกตาม ID หมู่บ้าน
// @Summary Get households by village ID
// @Tags Household
// @Produce json
// @Param id path int true "Village ID"
// @Success 200 {array} HouseholdResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/villages/{id}/households [get]
func (h *HouseholdHandler) GetByVillageID(c *gin.Context) {
	villageIDStr := c.Param("id")
	villageID, err := strconv.ParseUint(villageIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ของหมู่บ้านไม่ถูกต้อง"})
		return
	}

	monthStr := c.Query("month")
	yearStr := c.Query("year")

	month := 0
	year := 0

	if m, err := strconv.Atoi(monthStr); err == nil && m >= 1 && m <= 12 {
		month = m
	}
	if y, err := strconv.Atoi(yearStr); err == nil && y > 2000 {
		year = y
	}

	households, err := h.service.GetByVillageID(uint(villageID), month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูลครัวเรือน: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, households)
}

// Create สร้างครัวเรือนใหม่
// @Router /api/households [post]
func (h *HouseholdHandler) Create(c *gin.Context) {
	var req CreateHouseholdRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.service.Create(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

// Update แก้ไขข้อมูลครัวเรือน
// @Router /api/households/{id} [patch]
func (h *HouseholdHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	var req UpdateHouseholdRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.service.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// Delete ลบข้อมูลครัวเรือน
// @Router /api/households/{id} [delete]
func (h *HouseholdHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	err = h.service.Delete(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลครัวเรือนเรียบร้อยแล้ว"})
}
