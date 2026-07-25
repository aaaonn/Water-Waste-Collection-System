package garbage_rate

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GarbageRateHandler ตัวควบคุม HTTP requests/responses สำหรับอัตราค่าขยะ
type GarbageRateHandler struct {
	service GarbageRateService
}

// NewGarbageRateHandler สร้างอินสแตนซ์ของ Handler
func NewGarbageRateHandler(s GarbageRateService) *GarbageRateHandler {
	return &GarbageRateHandler{service: s}
}

// Create สร้างอัตราค่าขยะอันใหม่
// @Summary Create a garbage rate
// @Tags GarbageRate
// @Accept json
// @Produce json
// @Param request body CreateGarbageRateRequest true "Create Garbage Rate Request"
// @Success 201 {object} GarbageRateResponse
// @Failure 400 {object} map[string]string
// @Router /api/garbage-rates [post]
func (h *GarbageRateHandler) Create(c *gin.Context) {
	var req CreateGarbageRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกข้อมูลให้ถูกต้องครบถ้วน: " + err.Error()})
		return
	}

	res, err := h.service.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

// GetByID ดึงข้อมูลอัตราค่าขยะตาม ID
// @Summary Get a garbage rate by ID
// @Tags GarbageRate
// @Produce json
// @Param id path int true "Garbage Rate ID"
// @Success 200 {object} GarbageRateResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/garbage-rates/{id} [get]
func (h *GarbageRateHandler) GetByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัส ID ของอัตราค่าบริการขยะไม่ถูกต้อง"})
		return
	}

	res, err := h.service.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// GetAll ดึงข้อมูลอัตราค่าขยะทั้งหมด รองรับการกรองตามตำบล
// @Summary Get all garbage rates
// @Tags GarbageRate
// @Produce json
// @Param subdistrict_id query int false "Subdistrict ID Filter"
// @Success 200 {array} GarbageRateResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/garbage-rates [get]
func (h *GarbageRateHandler) GetAll(c *gin.Context) {
	var subdistrictID uint
	subdistrictIDStr := c.Query("subdistrict_id")

	if subdistrictIDStr != "" {
		parsed, err := strconv.ParseUint(subdistrictIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบรหัสตำบลไม่ถูกต้อง"})
			return
		}
		subdistrictID = uint(parsed)
	} else {
		if subdistrictIDVal, exists := c.Get("subdistrict_id"); exists {
			if val, ok := subdistrictIDVal.(uint); ok {
				subdistrictID = val
			} else if valFloat, okFloat := subdistrictIDVal.(float64); okFloat {
				subdistrictID = uint(valFloat)
			} else if valInt, okInt := subdistrictIDVal.(int); okInt {
				subdistrictID = uint(valInt)
			}
		}
	}

	rates, err := h.service.GetAll(subdistrictID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, rates)
}

// Update แก้ไขเฉพาะจุดของข้อมูลอัตราค่าขยะ
// @Summary Update a garbage rate
// @Tags GarbageRate
// @Accept json
// @Produce json
// @Param id path int true "Garbage Rate ID"
// @Param request body UpdateGarbageRateRequest true "Update Garbage Rate Request"
// @Success 200 {object} GarbageRateResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/garbage-rates/{id} [patch]
func (h *GarbageRateHandler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัส ID ของอัตราค่าบริการขยะไม่ถูกต้อง"})
		return
	}

	var req UpdateGarbageRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	res, err := h.service.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// Delete ลบข้อมูลอัตราค่าขยะ (Soft Delete)
// @Summary Delete a garbage rate
// @Tags GarbageRate
// @Produce json
// @Param id path int true "Garbage Rate ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/garbage-rates/{id} [delete]
func (h *GarbageRateHandler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัส ID ของอัตราค่าบริการขยะไม่ถูกต้อง"})
		return
	}

	err = h.service.Delete(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลอัตราค่าบริการขยะเรียบร้อยแล้ว (Soft Delete)"})
}
