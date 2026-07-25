package invoice_and_receipt

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type InvoiceReceiptHandler struct {
	service InvoiceReceiptService
}

func NewInvoiceReceiptHandler(s InvoiceReceiptService) *InvoiceReceiptHandler {
	return &InvoiceReceiptHandler{service: s}
}

func (h *InvoiceReceiptHandler) GetInvoice(c *gin.Context) {
	subdistrictID, err := h.getSubdistrictID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	householdID, err := h.getHouseholdID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสครัวเรือนไม่ถูกต้อง"})
		return
	}

	month, year := h.getMonthAndYear(c)

	res, err := h.service.GetInvoice(householdID, subdistrictID, month, year)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *InvoiceReceiptHandler) GetReceipt(c *gin.Context) {
	subdistrictID, err := h.getSubdistrictID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	householdID, err := h.getHouseholdID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสครัวเรือนไม่ถูกต้อง"})
		return
	}

	month, year := h.getMonthAndYear(c)

	res, err := h.service.GetReceipt(householdID, subdistrictID, month, year)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *InvoiceReceiptHandler) getSubdistrictID(c *gin.Context) (uint, error) {
	subdistrictIDVal, exists := c.Get("subdistrict_id")
	if !exists {
		return 0, errors.New("ไม่พบข้อมูลสิทธิ์ของตำบลในรหัสอ้างอิง")
	}

	if val, ok := subdistrictIDVal.(uint); ok {
		return val, nil
	} else if valFloat, okFloat := subdistrictIDVal.(float64); okFloat {
		return uint(valFloat), nil
	} else if valInt, okInt := subdistrictIDVal.(int); okInt {
		return uint(valInt), nil
	}
	return 0, errors.New("ข้อมูลสิทธิ์ตำบลประเภทไม่ถูกต้อง")
}

func (h *InvoiceReceiptHandler) getHouseholdID(c *gin.Context) (uint, error) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func (h *InvoiceReceiptHandler) getMonthAndYear(c *gin.Context) (int, int) {
	var month int
	var year int
	if m := c.Query("month"); m != "" {
		month, _ = strconv.Atoi(m)
	}
	if y := c.Query("year"); y != "" {
		year, _ = strconv.Atoi(y)
	}

	if month <= 0 {
		month = int(time.Now().Month())
	}
	if year <= 0 {
		year = time.Now().Year()
	}
	return month, year
}
