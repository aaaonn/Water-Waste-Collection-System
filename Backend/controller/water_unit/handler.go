package water_unit

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// WaterUnitHandler ควบคุมคำขอ HTTP ของระบบอัตราค่าน้ำประปา
type WaterUnitHandler struct {
	service WaterUnitService
}

// NewWaterUnitHandler สร้างอินสแตนซ์ของ Handler
func NewWaterUnitHandler(s WaterUnitService) *WaterUnitHandler {
	return &WaterUnitHandler{service: s}
}

// Create สร้างอัตราค่าน้ำประปาขั้นบันไดรายการใหม่
// @Summary Create a water unit tier
// @Tags WaterUnit
// @Accept json
// @Produce json
// @Param request body CreateWaterUnitRequest true "Create Water Unit Request"
// @Success 201 {object} WaterUnitResponse
// @Failure 400 {object} map[string]string
// @Router /api/water-units [post]
func (h *WaterUnitHandler) Create(c *gin.Context) {
	var req CreateWaterUnitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน: " + err.Error()})
		return
	}

	waterUnit, err := h.service.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, waterUnit)
}

// GetByID ดึงข้อมูลค่าน้ำประปาหนึ่งรายการตาม ID
// @Summary Get a water unit tier by ID
// @Tags WaterUnit
// @Produce json
// @Param id path int true "Water Unit ID"
// @Success 200 {object} WaterUnitResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/water-units/{id} [get]
func (h *WaterUnitHandler) GetByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัส ID รูปแบบไม่ถูกต้อง"})
		return
	}

	waterUnit, err := h.service.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, waterUnit)
}

// GetAll ดึงข้อมูลอัตราค่าน้ำประปาทั้งหมด รองรับการกรองตามตำบล
// @Summary Get all water unit tiers
// @Tags WaterUnit
// @Produce json
// @Param subdistrict_id query int false "Subdistrict ID Filter"
// @Success 200 {array} WaterUnitResponse
// @Failure 500 {object} map[string]string
// @Router /api/water-units [get]
func (h *WaterUnitHandler) GetAll(c *gin.Context) {
	var subdistrictID uint
	subdistrictIDStr := c.Query("subdistrict_id")
	
	if subdistrictIDStr != "" {
		parsed, err := strconv.ParseUint(subdistrictIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบของรหัสตำบลไม่ถูกต้อง"})
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

	var monthPtr *int
	var yearPtr *int

	monthStr := c.Query("month")
	if monthStr != "" {
		m, err := strconv.Atoi(monthStr)
		if err == nil {
			monthPtr = &m
		}
	}

	yearStr := c.Query("year")
	if yearStr != "" {
		y, err := strconv.Atoi(yearStr)
		if err == nil {
			yearPtr = &y
		}
	}

	waterUnits, err := h.service.GetAll(subdistrictID, monthPtr, yearPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, waterUnits)
}

// Update แก้ไขเฉพาะส่วนข้อมูลอัตราค่าน้ำประปา
// @Summary Update specific fields of a water unit tier
// @Tags WaterUnit
// @Accept json
// @Produce json
// @Param id path int true "Water Unit ID"
// @Param request body UpdateWaterUnitRequest true "Update Water Unit Request"
// @Success 200 {object} WaterUnitResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/water-units/{id} [patch]
func (h *WaterUnitHandler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัส ID รูปแบบไม่ถูกต้อง"})
		return
	}

	var req UpdateWaterUnitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	waterUnit, err := h.service.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, waterUnit)
}

// Delete ลบข้อมูลอัตราค่าน้ำประปา (Soft Delete)
// @Summary Delete a water unit tier
// @Tags WaterUnit
// @Produce json
// @Param id path int true "Water Unit ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/water-units/{id} [delete]
func (h *WaterUnitHandler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัส ID รูปแบบไม่ถูกต้อง"})
		return
	}

	err = h.service.Delete(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลอัตราค่าน้ำประปาเรียบร้อยแล้ว (Soft Delete)"})
}