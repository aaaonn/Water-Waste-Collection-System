package household

import (
	"encoding/csv"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

var reNonNumeric = regexp.MustCompile(`[^0-9.]`)

// Import รับไฟล์และทำการ Parse ก่อนส่งให้ Service จัดการ
// @Router /api/households/import [post]
func (h *HouseholdHandler) Import(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบไฟล์ที่อัปโหลด"})
		return
	}

	// เช็คว่าเป็น Staff/Admin ที่กำลังทำรายการหรือไม่
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้งาน"})
		return
	}
	staffID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "รหัสผู้ใช้งานไม่ถูกต้อง"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".csv" && ext != ".xlsx" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รองรับเฉพาะไฟล์ .csv และ .xlsx เท่านั้น"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเปิดไฟล์ได้"})
		return
	}
	defer src.Close()

	var response ImportHouseholdResponse
	var validReqs []CreateHouseholdRequest

	if ext == ".csv" {
		reader := csv.NewReader(src)
		// ข้ามบรรทัดหัวตาราง (Header)
		if _, err := reader.Read(); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่สามารถอ่านไฟล์ CSV ได้"})
			return
		}

		records, err := reader.ReadAll()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูล CSV ไม่ถูกต้อง"})
			return
		}

		response.TotalRows = len(records)

		for i, row := range records {
			rowNum := i + 2
			if len(row) < 13 {
				response.FailedCount++
				response.Results = append(response.Results, ImportHouseholdResult{
					RowNumber: rowNum,
					Success:   false,
					Error:     fmt.Sprintf("คอลัมน์ไม่ครบ (พบแค่ %d คอลัมน์)", len(row)),
				})
				continue
			}

			req, err := parseRow(row, staffID)
			if err != nil {
				response.FailedCount++
				response.Results = append(response.Results, ImportHouseholdResult{
					RowNumber: rowNum,
					Success:   false,
					Error:     err.Error(),
				})
			} else {
				req.RowNumber = rowNum
				validReqs = append(validReqs, req)
			}
		}
	} else if ext == ".xlsx" {
		f, err := excelize.OpenReader(src)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่สามารถอ่านไฟล์ Excel ได้"})
			return
		}
		defer f.Close()

		sheetName := f.GetSheetName(0) // ดึงชีทแรก
		rows, err := f.GetRows(sheetName)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "อ่านข้อมูลในชีทไม่ได้"})
			return
		}

		if len(rows) < 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลในไฟล์ Excel"})
			return
		}

		response.TotalRows = len(rows) - 1

		for i, row := range rows {
			if i == 0 {
				continue // ข้าม header
			}
			rowNum := i + 1
			// ถ้ายาวไม่ถึง 13 ให้เติม empty string ให้ครบ
			for len(row) < 13 {
				row = append(row, "")
			}
			req, err := parseRow(row, staffID)
			if err != nil {
				response.FailedCount++
				response.Results = append(response.Results, ImportHouseholdResult{
					RowNumber: rowNum,
					Success:   false,
					Error:     err.Error(),
				})
			} else {
				req.RowNumber = rowNum
				validReqs = append(validReqs, req)
			}
		}
	}

	// ถ้ามี Error จากการอ่านไฟล์ (Phase 1) ให้ตีกลับทั้งหมด ไม่ส่งไปเช็คฐานข้อมูลเลย (All-or-Nothing)
	if response.FailedCount > 0 {
		c.JSON(http.StatusOK, response)
		return
	}

	// ถ้าไฟล์ถูกฟอร์แมต 100% ส่งไปเช็คฐานข้อมูลต่อใน Service (Phase 2)
	res := h.service.Import(validReqs)
	c.JSON(http.StatusOK, res)
}

func parseRow(row []string, staffID uint) (CreateHouseholdRequest, error) {
	var req CreateHouseholdRequest
	req.StaffID = staffID
	var errs []string

	// Clean up strings to avoid \r, zero-width spaces, etc.
	for i := range row {
		row[i] = strings.TrimSpace(row[i])
	}

	cleanVillageID := reNonNumeric.ReplaceAllString(row[0], "")
	villageIDFloat, err := strconv.ParseFloat(cleanVillageID, 64)
	if err != nil {
		errs = append(errs, "รหัสหมู่บ้าน (VillageID) ต้องเป็นตัวเลข")
	} else {
		req.VillageID = uint(villageIDFloat)
	}
	
	req.HouseNumber = row[1]
	req.HouseCode = row[2]
	req.TitleName = row[3]
	req.FirstName = row[4]
	req.LastName = row[5]

	// ตรวจสอบข้อมูลบังคับ
	if req.HouseNumber == "" {
		errs = append(errs, "ขาดบ้านเลขที่ (HouseNumber)")
	}
	if req.HouseCode == "" {
		errs = append(errs, "ขาดรหัสครัวเรือน (HouseCode)")
	}
	if req.TitleName == "" {
		errs = append(errs, "ขาดคำนำหน้า (TitleName)")
	}
	if req.FirstName == "" || req.LastName == "" {
		errs = append(errs, "ขาดชื่อ-นามสกุล")
	}

	req.CitizenID = strings.ReplaceAll(row[6], "-", "")
	if len(req.CitizenID) != 13 || reNonNumeric.ReplaceAllString(req.CitizenID, "") != req.CitizenID {
		errs = append(errs, "รหัสบัตรประชาชน (CitizenID) ต้องเป็นตัวเลข 13 หลัก")
	}

	req.PhoneNumber = strings.ReplaceAll(row[7], "-", "")
	if req.PhoneNumber != "" && (len(req.PhoneNumber) < 9 || len(req.PhoneNumber) > 10 || reNonNumeric.ReplaceAllString(req.PhoneNumber, "") != req.PhoneNumber) {
		errs = append(errs, "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก")
	}

	req.WaterUserID = row[8]
	req.WaterStatus = row[9]
	waterStatusLower := strings.ToLower(req.WaterStatus)
	if waterStatusLower != "active" && waterStatusLower != "inactive" {
		errs = append(errs, fmt.Sprintf("สถานะใช้น้ำต้องเป็น active หรือ inactive (พบ: '%s')", req.WaterStatus))
	}
	
	if row[10] != "" {
		prev, err := strconv.ParseFloat(row[10], 64)
		if err != nil {
			errs = append(errs, "ค่าน้ำเริ่มต้น (PrevReading) ต้องเป็นตัวเลข")
		} else {
			req.PrevReading = prev
		}
	} else {
		req.PrevReading = 0
	}

	req.GarbageStatus = row[11]
	
	garbageStatusLower := strings.ToLower(req.GarbageStatus)
	if garbageStatusLower == "active" {
		if row[12] == "" {
			errs = append(errs, "สถานะทิ้งขยะเป็น active โปรดระบุขนาดถังขยะคอลัมน์ที่ 12")
		} else {
			cleanGarbageSizeID := reNonNumeric.ReplaceAllString(row[12], "")
			// ใช้ ParseFloat เพื่อรองรับกรณี Excel ส่งค่ามาเป็น 1.0 หรือมีอักขระซ่อน
			garbageSizeFloat, err := strconv.ParseFloat(cleanGarbageSizeID, 64)
			if err != nil {
				errs = append(errs, fmt.Sprintf("รหัสขนาดถังขยะต้องเป็นตัวเลขเท่านั้น (พบ: '%s')", row[12]))
			} else {
				gId := uint(garbageSizeFloat)
				req.GarbageSizeID = &gId
			}
		}
	} else if garbageStatusLower == "inactive" {
		if row[12] != "" {
			errs = append(errs, fmt.Sprintf("สถานะทิ้งขยะเป็น inactive ช่องขนาดถังขยะต้องเว้นว่างไว้ (พบ: '%s')", row[12]))
		}
		req.GarbageSizeID = nil
	} else {
		errs = append(errs, fmt.Sprintf("สถานะทิ้งขยะต้องเป็น active หรือ inactive (พบ: '%s')", req.GarbageStatus))
	}

	if len(errs) > 0 {
		return req, errors.New(strings.Join(errs, ", "))
	}

	return req, nil
}
