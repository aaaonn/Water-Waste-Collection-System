package dashboard

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	service DashboardService
}

func NewDashboardHandler(s DashboardService) *DashboardHandler {
	return &DashboardHandler{service: s}
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	var subdistrictID uint

	// ดึงค่า subdistrict_id ที่มาจาก JWT Token (ถูกตั้งโดย AuthMiddleware)
	if val, exists := c.Get("subdistrict_id"); exists {
		if uVal, ok := val.(uint); ok {
			subdistrictID = uVal
		} else if floatVal, ok := val.(float64); ok {
			subdistrictID = uint(floatVal)
		} else if intVal, ok := val.(int); ok {
			subdistrictID = uint(intVal)
		}
	}

	if subdistrictID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "สิทธิ์การเข้าถึงตำบลไม่ถูกต้อง"})
		return
	}

	monthStr := c.Query("month")
	yearStr := c.Query("year")
	villageStr := c.Query("village_id")

	month := time.Now().Month()
	year := time.Now().Year()
	villageID := uint(0)

	if m, err := strconv.Atoi(monthStr); err == nil && m >= 1 && m <= 12 {
		month = time.Month(m)
	}
	if y, err := strconv.Atoi(yearStr); err == nil && y > 2000 {
		year = y
	}
	if v, err := strconv.Atoi(villageStr); err == nil && v > 0 {
		villageID = uint(v)
	}

	stats, err := h.service.GetStats(subdistrictID, int(month), year, villageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลสถิติแดชบอร์ดได้: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
