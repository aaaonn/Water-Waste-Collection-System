package householde_list

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type MobileHouseholdHandler struct {
	service MobileHouseholdService
}

func NewMobileHouseholdHandler(s MobileHouseholdService) *MobileHouseholdHandler {
	return &MobileHouseholdHandler{service: s}
}

func (h *MobileHouseholdHandler) GetMobileHouseholds(c *gin.Context) {
	// 1. ดึงข้อมูล subdistrict_id จาก Context ที่แนบมาโดย AuthMiddleware
	subdistrictIDVal, exists := c.Get("subdistrict_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลสิทธิ์ของตำบลในรหัสอ้างอิง"})
		return
	}

	subdistrictID, ok := subdistrictIDVal.(uint)
	if !ok {
		// รองรับกรณีที่ข้อมูลแปลงเป็น type float64 หรือ int จาก GIN claims/tests
		if valFloat, okFloat := subdistrictIDVal.(float64); okFloat {
			subdistrictID = uint(valFloat)
		} else if valInt, okInt := subdistrictIDVal.(int); okInt {
			subdistrictID = uint(valInt)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ข้อมูลสิทธิ์ตำบลประเภทไม่ถูกต้อง"})
			return
		}
	}

	// 2. Bind พารามิเตอร์ของฟิลเตอร์สืบค้น (รองรับทั้ง JSON และ Query Params รวมถึงการส่งตัวเลขในรูปแบบ string)
	var raw rawMobileHouseholdRequest

	contentType := c.GetHeader("Content-Type")
	if strings.Contains(strings.ToLower(contentType), "application/json") {
		if err := c.ShouldBindJSON(&raw); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูล JSON ไม่ถูกต้อง: " + err.Error()})
			return
		}
	} else {
		var qRaw struct {
			VillageID string `form:"village_id"`
			Month     string `form:"month"`
			Year      string `form:"year"`
			Status    string `form:"status"`
			Query     string `form:"query"`
		}
		if err := c.ShouldBindQuery(&qRaw); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลคำขอกรองไม่ถูกต้อง: " + err.Error()})
			return
		}
		if qRaw.VillageID != "" {
			raw.VillageID = qRaw.VillageID
		}
		if qRaw.Month != "" {
			raw.Month = qRaw.Month
		}
		if qRaw.Year != "" {
			raw.Year = qRaw.Year
		}
		raw.Status = qRaw.Status
		raw.Query = qRaw.Query
	}

	// GIN's ShouldBindQuery doesn't support binding directly to interface{} fields,
	// so we manually check query parameters as a fallback if they are nil.
	if raw.Month == nil {
		if m := c.Query("month"); m != "" {
			raw.Month = m
		}
	}
	if raw.Year == nil {
		if y := c.Query("year"); y != "" {
			raw.Year = y
		}
	}
	if raw.VillageID == nil {
		if vid := c.Query("village_id"); vid != "" {
			raw.VillageID = vid
		}
	}

	// แปลงข้อมูลให้อยู่ในประเภทข้อมูลที่ถูกต้อง
	var req MobileHouseholdRequest
	req.Status = raw.Status
	req.Query = raw.Query

	if raw.VillageID != nil {
		if val, ok := parseInterfaceToUint(raw.VillageID); ok {
			req.VillageID = val
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลคำขอกรองไม่ถูกต้อง: village_id ต้องเป็นตัวเลข"})
			return
		}
	}

	if raw.Month != nil {
		if val, ok := parseInterfaceToInt(raw.Month); ok {
			req.Month = val
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลคำขอกรองไม่ถูกต้อง: month ต้องเป็นตัวเลข"})
			return
		}
	}

	if raw.Year != nil {
		if val, ok := parseInterfaceToInt(raw.Year); ok {
			req.Year = val
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลคำขอกรองไม่ถูกต้อง: year ต้องเป็นตัวเลข"})
			return
		}
	}

	// ตรวจสอบข้อมูลเงื่อนไขบังคับ (Validation)
	if req.Month < 1 || req.Month > 12 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลคำขอกรองไม่ถูกต้อง: month (เดือน) ต้องระบุค่าระหว่าง 1 ถึง 12"})
		return
	}
	if req.Year <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลคำขอกรองไม่ถูกต้อง: year (ปี) ต้องระบุค่าให้ถูกต้อง"})
		return
	}

	// 3. เรียกใช้งาน Service เลเยอร์ประมวลผลตรรกะทางธุรกิจ
	households, err := h.service.GetMobileHouseholds(subdistrictID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลครัวเรือนได้: " + err.Error()})
		return
	}

	// 4. ส่งกลับข้อมูลสำเร็จ
	c.JSON(http.StatusOK, households)
}

func (h *MobileHouseholdHandler) GetMobileHouseholdByID(c *gin.Context) {
	subdistrictIDVal, exists := c.Get("subdistrict_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลสิทธิ์ของตำบลในรหัสอ้างอิง"})
		return
	}

	subdistrictID, ok := subdistrictIDVal.(uint)
	if !ok {
		if valFloat, okFloat := subdistrictIDVal.(float64); okFloat {
			subdistrictID = uint(valFloat)
		} else if valInt, okInt := subdistrictIDVal.(int); okInt {
			subdistrictID = uint(valInt)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ข้อมูลสิทธิ์ตำบลประเภทไม่ถูกต้อง"})
			return
		}
	}

	idParam := c.Param("id")
	householdID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสครัวเรือนไม่ถูกต้อง"})
		return
	}

	// Parse optional month and year from query parameters
	var month int
	var year int
	if m := c.Query("month"); m != "" {
		month, _ = strconv.Atoi(m)
	}
	if y := c.Query("year"); y != "" {
		year, _ = strconv.Atoi(y)
	}

	// Fallback to current month/year if not provided
	if month <= 0 {
		month = int(time.Now().Month())
	}
	if year <= 0 {
		year = time.Now().Year()
	}

	household, err := h.service.GetMobileHouseholdByID(uint(householdID), subdistrictID, month, year)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลครัวเรือนที่ระบุ หรือคุณไม่มีสิทธิ์เข้าถึง: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, household)
}

// rawMobileHouseholdRequest สำหรับรองรับการส่งข้อมูลทางฝั่ง Client ในรูปแบบที่ยืดหยุ่น (ทั้ง string และ number)
type rawMobileHouseholdRequest struct {
	VillageID interface{} `json:"village_id" form:"village_id"`
	Month     interface{} `json:"month" form:"month"`
	Year      interface{} `json:"year" form:"year"`
	Status    string      `json:"status" form:"status"`
	Query     string      `json:"query" form:"query"`
}

// parseInterfaceToInt แปลงค่า interface{} เป็น int รองรับทั้ง string, float64 (จาก JSON), และ int
func parseInterfaceToInt(val interface{}) (int, bool) {
	if val == nil {
		return 0, false
	}
	switch v := val.(type) {
	case int:
		return v, true
	case int64:
		return int(v), true
	case float64:
		return int(v), true
	case string:
		vTrimmed := strings.TrimSpace(v)
		if vTrimmed == "" {
			return 0, false
		}
		res, err := strconv.Atoi(vTrimmed)
		if err != nil {
			return 0, false
		}
		return res, true
	case []string:
		if len(v) > 0 {
			return parseInterfaceToInt(v[0])
		}
		return 0, false
	default:
		return 0, false
	}
}

// parseInterfaceToUint แปลงค่า interface{} เป็น uint รองรับทั้ง string, float64 (จาก JSON), และ uint/int
func parseInterfaceToUint(val interface{}) (uint, bool) {
	if val == nil {
		return 0, false
	}
	switch v := val.(type) {
	case int:
		return uint(v), true
	case int64:
		return uint(v), true
	case float64:
		return uint(v), true
	case string:
		vTrimmed := strings.TrimSpace(v)
		if vTrimmed == "" {
			return 0, false
		}
		res, err := strconv.Atoi(vTrimmed)
		if err != nil {
			return 0, false
		}
		return uint(res), true
	case []string:
		if len(v) > 0 {
			return parseInterfaceToUint(v[0])
		}
		return 0, false
	default:
		return 0, false
	}
}
