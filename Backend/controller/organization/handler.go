package organization

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
)

// OrganizationHandler ทำหน้าที่รับ Request จากผู้ใช้งานและส่งต่อให้ Service
type OrganizationHandler struct {
	service OrganizationService
}

func NewOrganizationHandler(service OrganizationService) *OrganizationHandler {
	return &OrganizationHandler{service: service}
}

// GetOrganization ดึงข้อมูลองค์กร (ชื่อตำบล, ที่อยู่, ข้อมูลนายก)
func (h *OrganizationHandler) GetOrganization(c *gin.Context) {
	response, err := h.service.GetOrganization()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get organization data", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": response})
}

// UpdateOrganization อัปเดตข้อมูลองค์กร (ข้อมูลนายก และที่อยู่สำนักงาน)
func (h *OrganizationHandler) UpdateOrganization(c *gin.Context) {
	var req UpdateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Validate using govalidator
	if _, err := govalidator.ValidateStruct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateOrganization(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update organization data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Organization updated successfully"})
}
