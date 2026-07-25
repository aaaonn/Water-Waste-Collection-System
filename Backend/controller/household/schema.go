package household

import (
	"backend/entity"
)

// CreateHouseholdRequest DTO สำหรับสร้างข้อมูลครัวเรือน
type CreateHouseholdRequest struct {
	RowNumber     int     `json:"-"` // ใช้เก็บเลขบรรทัดตอนทำ Bulk Import
	VillageID     uint    `json:"village_id" binding:"required"`
	HouseNumber   string  `json:"house_number" binding:"required"`
	HouseCode     string  `json:"house_code" binding:"required"`
	TitleName     string  `json:"title_name" binding:"required"`
	FirstName     string  `json:"first_name" binding:"required"`
	LastName      string  `json:"last_name" binding:"required"`
	CitizenID     string  `json:"citizen_id" binding:"required"`
	PhoneNumber   string  `json:"phone_number" binding:"required"`
	WaterUserID   string  `json:"water_user_id" binding:"required"`
	PrevReading   float64 `json:"prev_reading"`
	StaffID       uint    `json:"staff_id" binding:"required"`
	WaterStatus   string  `json:"water_status" binding:"required"`
	GarbageStatus string  `json:"garbage_status" binding:"required"`
	GarbageSizeID *uint   `json:"garbage_size_id"`
}

// UpdateHouseholdRequest DTO สำหรับอัปเดตข้อมูลครัวเรือน
type UpdateHouseholdRequest struct {
	VillageID     uint     `json:"village_id"`
	HouseNumber   string   `json:"house_number"`
	HouseCode     string   `json:"house_code"`
	TitleName     string   `json:"title_name"`
	FirstName     string   `json:"first_name"`
	LastName      string   `json:"last_name"`
	CitizenID     string   `json:"citizen_id"`
	PhoneNumber   string   `json:"phone_number"`
	WaterUserID   string   `json:"water_user_id"`
	WaterStatus   string   `json:"water_status"`
	GarbageStatus string   `json:"garbage_status"`
	PrevReading   *float64 `json:"prev_reading"`
	GarbageSizeID *uint    `json:"garbage_size_id"`
	Username      string   `json:"username"`
	Password      string   `json:"password"`
}

// HouseholdResponse DTO สำหรับตอบกลับข้อมูลครัวเรือน
type HouseholdResponse struct {
	ID                uint     `json:"id"`
	VillageID         uint     `json:"village_id"`
	HouseNumber       string   `json:"house_number"`
	HouseCode         string   `json:"house_code"`
	TitleName         string   `json:"title_name"`
	FirstName         string   `json:"first_name"`
	LastName          string   `json:"last_name"`
	CitizenID         string   `json:"citizen_id"`
	PhoneNumber       string   `json:"phone_number"`
	WaterUserID       string   `json:"water_user_id"`
	WaterStatus       string   `json:"water_status"`
	GarbageStatus     string   `json:"garbage_status"`
	IsWaterRecorded   bool     `json:"is_water_recorded"`
	IsGarbageRecorded bool     `json:"is_garbage_recorded"`
	PrevReading       *float64 `json:"prev_reading,omitempty"`
	GarbageSizeID     *uint    `json:"garbage_size_id,omitempty"`
	Username          string   `json:"username,omitempty"`

	// ฟิลด์เพิ่มเติมสำหรับดึงข้อมูลบันทึกจริงเพื่อนำไปใช้ในรายงาน Excel
	WaterPrevReading   *float64 `json:"water_prev_reading,omitempty"`
	WaterCurrReading   *float64 `json:"water_curr_reading,omitempty"`
	WaterConsumed      *float64 `json:"water_consumed,omitempty"`
	WaterTotalAmount   *float64 `json:"water_total_amount,omitempty"`
	GarbageTotalAmount *float64 `json:"garbage_total_amount,omitempty"`
	Garbage20Amount    int      `json:"garbage_20_amount"`
	Garbage40Amount    int      `json:"garbage_40_amount"`
	Garbage60Amount    int      `json:"garbage_60_amount"`
	Garbage100Amount   int      `json:"garbage_100_amount"`
}

// ToHouseholdResponse แปลง Entity เป็น Response DTO พร้อมสถานะการจดบันทึก
func ToHouseholdResponse(h *entity.HouseHold, isWaterRecorded bool, isGarbageRecorded bool) HouseholdResponse {
	var prevReading *float64
	var garbageSizeID *uint

	if len(h.WaterReadings) > 0 {
		prevReading = &h.WaterReadings[0].PrevReading
	}
	if len(h.GarbageReadings) > 0 && len(h.GarbageReadings[0].GarbageReadingDetails) > 0 {
		garbageSizeID = &h.GarbageReadings[0].GarbageReadingDetails[0].GarbageSizeID
	}

	var username string
	if h.Login != nil {
		username = h.Login.Username
	}

	return HouseholdResponse{
		ID:                h.ID,
		VillageID:         h.VillageID,
		HouseNumber:       h.HouseNumber,
		HouseCode:         h.HouseCode,
		TitleName:         string(h.TitleName),
		FirstName:         h.FirstName,
		LastName:          h.LastName,
		CitizenID:         h.CitizenID,
		PhoneNumber:       h.PhoneNumber,
		WaterUserID:       h.WaterUserID,
		WaterStatus:       string(h.WaterStatus),
		GarbageStatus:     string(h.GarbageStatus),
		IsWaterRecorded:   isWaterRecorded,
		IsGarbageRecorded: isGarbageRecorded,
		PrevReading:       prevReading,
		GarbageSizeID:     garbageSizeID,
		Username:          username,
	}
}

// ToHouseholdResponseWithReadings แปลง Entity พร้อมข้อมูลการบันทึกประจำรอบเดือนเป็น Response DTO สำหรับรายงาน Excel
func ToHouseholdResponseWithReadings(h *entity.HouseHold, isWaterRecorded bool, isGarbageRecorded bool, wr *entity.WaterReading, gr *entity.GarbageReading) HouseholdResponse {
	res := ToHouseholdResponse(h, isWaterRecorded, isGarbageRecorded)

	if wr != nil {
		res.WaterPrevReading = &wr.PrevReading
		res.WaterCurrReading = &wr.CurrReading
		res.WaterConsumed = &wr.UnitConsumed
		res.WaterTotalAmount = &wr.TotalAmount
	}

	if gr != nil {
		res.GarbageTotalAmount = &gr.TotalAmount
		for _, d := range gr.GarbageReadingDetails {
			cost := 0.0
			if d.GarbageSize != nil {
				cost = d.GarbageSize.Cost
			}
			switch cost {
			case 20.0:
				res.Garbage20Amount += d.Amount
			case 40.0:
				res.Garbage40Amount += d.Amount
			case 60.0:
				res.Garbage60Amount += d.Amount
			case 100.0:
				res.Garbage100Amount += d.Amount
			}
		}
	}

	return res

}
// ImportHouseholdResult DTO สำหรับเก็บผลลัพธ์การนำเข้าแต่ละแถว
type ImportHouseholdResult struct {
	RowNumber int                `json:"row_number"`          // แถวที่เท่าไหร่ในไฟล์
	Success   bool               `json:"success"`             // สำเร็จหรือไม่
	Skipped   bool               `json:"skipped,omitempty"`   // ถูกข้ามหรือไม่ (เช่น ข้อมูลซ้ำ 100%)
	Error     string             `json:"error,omitempty"`     // ข้อผิดพลาด (ถ้ามี)
	Data      *HouseholdResponse `json:"data,omitempty"`      // ข้อมูลที่บันทึกสำเร็จ
}

// ImportHouseholdResponse DTO สำหรับตอบกลับผลการนำเข้าทั้งหมด
type ImportHouseholdResponse struct {
	TotalRows    int                     `json:"total_rows"`    // จำนวนแถวทั้งหมด
	SuccessCount int                     `json:"success_count"` // จำนวนที่สำเร็จ
	FailedCount  int                     `json:"failed_count"`  // จำนวนที่ล้มเหลว
	SkippedCount int                     `json:"skipped_count"` // จำนวนที่ถูกข้าม
	Results      []ImportHouseholdResult `json:"results"`       // รายละเอียดผลลัพธ์แต่ละแถว
}
