package village

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// VillageHandler ตัวควบคุม HTTP requests/responses สำหรับข้อมูลหมู่บ้าน
type VillageHandler struct {
	service VillageService
}

// NewVillageHandler สร้างอินสแตนซ์ของ Handler
func NewVillageHandler(s VillageService) *VillageHandler {
	return &VillageHandler{service: s}
}

// GetAll ดึงข้อมูลหมู่บ้านทั้งหมด
// @Summary Get all villages
// @Tags Village
// @Produce json
// @Success 200 {array} VillageResponse
// @Failure 500 {object} map[string]string
// @Router /api/villages [get]
func (h *VillageHandler) GetAll(c *gin.Context) {
	villages, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูลหมู่บ้าน: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, villages)
}

// GetByID ดึงข้อมูลหมู่บ้านเดี่ยวตาม ID
// @Summary Get a village by ID
// @Tags Village
// @Produce json
// @Param id path int true "Village ID"
// @Success 200 {object} VillageResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/villages/{id} [get]
func (h *VillageHandler) GetByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัส ID ของหมู่บ้านรูปแบบไม่ถูกต้อง"})
		return
	}

	res, err := h.service.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// Create สร้างหมู่บ้านใหม่
// @Summary Create a village
// @Tags Village
// @Accept json
// @Produce json
// @Param request body CreateVillageRequest true "Create Village Request"
// @Success 201 {object} VillageResponse
// @Failure 400 {object} map[string]string
// @Router /api/villages [post]
func (h *VillageHandler) Create(c *gin.Context) {
	var req CreateVillageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกข้อมูลหมู่บ้านให้ถูกต้องครบถ้วน: " + err.Error()})
		return
	}

	res, err := h.service.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

// Update แก้ไขข้อมูลหมู่บ้านบางส่วน
// @Summary Update a village
// @Tags Village
// @Accept json
// @Produce json
// @Param id path int true "Village ID"
// @Param request body UpdateVillageRequest true "Update Village Request"
// @Success 200 {object} VillageResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/villages/{id} [patch]
func (h *VillageHandler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัส ID ของหมู่บ้านรูปแบบไม่ถูกต้อง"})
		return
	}

	var req UpdateVillageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลการแก้ไขไม่ถูกต้อง: " + err.Error()})
		return
	}

	res, err := h.service.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// Delete ลบข้อมูลหมู่บ้าน (Soft Delete)
// @Summary Delete a village
// @Tags Village
// @Produce json
// @Param id path int true "Village ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/villages/{id} [delete]
func (h *VillageHandler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัส ID ของหมู่บ้านรูปแบบไม่ถูกต้อง"})
		return
	}

	err = h.service.Delete(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลหมู่บ้านเรียบร้อยแล้ว (Soft Delete)"})
}
