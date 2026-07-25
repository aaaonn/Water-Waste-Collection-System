package reading

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ReadingHandler ตัวควบคุม HTTP สำหรับข้อมูลค่าน้ำและค่าขยะ
type ReadingHandler struct {
	service ReadingService
}

// NewReadingHandler สร้างอินสแตนซ์ของ Handler
func NewReadingHandler(s ReadingService) *ReadingHandler {
	return &ReadingHandler{service: s}
}

// GetLastWaterReading ดึงหน่วยมิเตอร์ครั้งล่าสุดของครัวเรือน
// @Summary Get last water reading for household
// @Tags Reading
// @Produce json
// @Param id path int true "Household ID"
// @Success 200 {object} LastWaterReadingResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/households/{id}/last-water-reading [get]
func (h *ReadingHandler) GetLastWaterReading(c *gin.Context) {
	householdIDStr := c.Param("id")
	householdID, err := strconv.ParseUint(householdIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ครัวเรือนไม่ถูกต้อง"})
		return
	}

	res, err := h.service.GetLastWaterReading(uint(householdID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูลมิเตอร์ล่าสุด: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// GetLastGarbageReading ดึงข้อมูลประวัติการจดเก็บขยะล่าสุดของครัวเรือน
// @Summary Get last garbage reading for household
// @Tags Reading
// @Produce json
// @Param id path int true "Household ID"
// @Success 200 {object} LastGarbageReadingResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/households/{id}/last-garbage-reading [get]
func (h *ReadingHandler) GetLastGarbageReading(c *gin.Context) {
	householdIDStr := c.Param("id")
	householdID, err := strconv.ParseUint(householdIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ครัวเรือนไม่ถูกต้อง"})
		return
	}

	res, err := h.service.GetLastGarbageReading(uint(householdID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติจดขยะล่าสุด: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}


// CreateWaterReading บันทึกหน่วยประปาใหม่และคำนวณราคาแบบขั้นบันได
// @Summary Create a new water reading
// @Tags Reading
// @Accept json
// @Produce json
// @Param request body CreateWaterReadingRequest true "Create Water Reading Request"
// @Success 201 {object} WaterReadingResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/water-readings [post]
func (h *ReadingHandler) CreateWaterReading(c *gin.Context) {
	var req CreateWaterReadingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกข้อมูลบันทึกน้ำประปาให้ถูกต้องครบถ้วน: " + err.Error()})
		return
	}

	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้งาน"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		if valFloat, okFloat := userIDVal.(float64); okFloat {
			userID = uint(valFloat)
		} else if valInt, okInt := userIDVal.(int); okInt {
			userID = uint(valInt)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ข้อมูลผู้ใช้งานประเภทไม่ถูกต้อง"})
			return
		}
	}

	staffID, err := h.service.GetStaffIDByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบพนักงานในระบบ: " + err.Error()})
		return
	}
	req.StaffID = staffID

	res, err := h.service.CreateWaterReading(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

// CreateGarbageReading บันทึกค่าบริการจดขยะใหม่
// @Summary Create a new garbage reading
// @Tags Reading
// @Accept json
// @Produce json
// @Param request body CreateGarbageReadingRequest true "Create Garbage Reading Request"
// @Success 201 {object} GarbageReadingResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/garbage-readings [post]
func (h *ReadingHandler) CreateGarbageReading(c *gin.Context) {
	var req CreateGarbageReadingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกข้อมูลบันทึกบริการขยะให้ถูกต้องครบถ้วน: " + err.Error()})
		return
	}

	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้งาน"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		if valFloat, okFloat := userIDVal.(float64); okFloat {
			userID = uint(valFloat)
		} else if valInt, okInt := userIDVal.(int); okInt {
			userID = uint(valInt)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ข้อมูลผู้ใช้งานประเภทไม่ถูกต้อง"})
			return
		}
	}

	staffID, err := h.service.GetStaffIDByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบพนักงานในระบบ: " + err.Error()})
		return
	}
	req.StaffID = staffID

	res, err := h.service.CreateGarbageReading(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}
