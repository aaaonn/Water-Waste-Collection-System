package village_list

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MobileVillageHandler ตัวควบคุม HTTP requests/responses สำหรับข้อมูลหมู่บ้าน
type MobileVillageHandler struct {
	service VillageService
}

// NewMobileVillageHandler สร้างอินสแตนซ์ของ Handler
func NewMobileVillageHandler(s VillageService) *MobileVillageHandler {
	return &MobileVillageHandler{service: s}
}

// GetAll ดึงข้อมูลหมู่บ้านทั้งหมด
// @Summary Get all villages
// @Tags Village
// @Produce json
// @Success 200 {array} VillageResponse
// @Failure 500 {object} map[string]string
// @Router /api/villages [get]
func (h *MobileVillageHandler) GetMobileVillages(c *gin.Context) {
	villages, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูลหมู่บ้าน: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, villages)
}

