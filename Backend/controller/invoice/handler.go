package invoice

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// InvoiceHandler เป็นตัวรับ HTTP Request จาก Router และติดต่อ Service
type InvoiceHandler struct {
	service InvoiceService
}

// NewInvoiceHandler เตรียมความพร้อมสร้าง Handler
func NewInvoiceHandler(service InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{service: service}
}

// GetByHouseholdID รับผิดชอบดึงบิลตาม ID ของครัวเรือน
// Query params:
// - status (optional): กรองสถานะบิลได้ (เช่น 'pending', 'paid')
func (h *InvoiceHandler) GetByHouseholdID(c *gin.Context) {
	// 1. อ่านพารามิเตอร์ ID จาก URL (เช่น /api/households/1/invoices -> ได้เลข 1)
	idParam := c.Param("id")
	householdID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid household ID"})
		return
	}

	// 2. อ่านค่า query string 'status' (ถ้ามีการแนบมา)
	status := c.Query("status")

	// 3. ส่งต่อข้อมูลไปให้ Service ทำงานเพื่อดึงบิล
	invoices, err := h.service.GetInvoicesByHouseholdID(uint(householdID), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 4. ส่งผลลัพธ์เป็น JSON กลับไปให้ผู้เรียก (Frontend/Mobile)
	c.JSON(http.StatusOK, gin.H{"data": invoices})
}
