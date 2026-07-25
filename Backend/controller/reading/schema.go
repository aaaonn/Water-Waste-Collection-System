package reading

import (
	"backend/entity"
)

// CreateWaterReadingRequest DTO สำหรับส่งข้อมูลบันทึกค่าน้ำใหม่
type CreateWaterReadingRequest struct {
	HouseHoldID uint    `json:"household_id" binding:"required"`
	StaffID     uint    `json:"staff_id"`
	CurrReading float64 `json:"curr_reading" binding:"required,gte=0"`
	Month       int     `json:"month"`
	Year        int     `json:"year"`
}

// WaterReadingResponse DTO สำหรับตอบกลับประวัติการบันทึกน้ำ
type WaterReadingResponse struct {
	ID           uint    `json:"id"`
	HouseHoldID  uint    `json:"household_id"`
	StaffID      uint    `json:"staff_id"`
	PrevReading  float64 `json:"prev_reading"`
	CurrReading  float64 `json:"curr_reading"`
	UnitConsumed float64 `json:"unit_consumed"`
	TotalAmount  float64 `json:"total_amount"`
	ReadingDate  string  `json:"reading_date"`
}

// GarbageReadingDetailRequest รายละเอียดถังขยะย่อยที่ส่งเข้ามาบันทึก
type GarbageReadingDetailRequest struct {
	GarbageSizeID uint `json:"garbage_size_id" binding:"required"`
	Amount        int  `json:"amount" binding:"required,gt=0"`
}

// CreateGarbageReadingRequest DTO สำหรับบันทึกค่าขยะใหม่
type CreateGarbageReadingRequest struct {
	HouseHoldID uint                          `json:"household_id" binding:"required"`
	StaffID     uint                          `json:"staff_id"`
	Details     []GarbageReadingDetailRequest `json:"details" binding:"dive"`
	Month       int                           `json:"month"`
	Year        int                           `json:"year"`
}

// GarbageDetailResponse รายละเอียดค่าขยะในบิล
type GarbageDetailResponse struct {
	ID            uint    `json:"id"`
	GarbageSizeID uint    `json:"garbage_size_id"`
	SizeName      string  `json:"size_name"`
	Cost          float64 `json:"cost"`
	Amount        int     `json:"amount"`
}

// GarbageReadingResponse DTO สำหรับตอบกลับประวัติการบันทึกขยะ
type GarbageReadingResponse struct {
	ID          uint                    `json:"id"`
	HouseHoldID uint                    `json:"household_id"`
	StaffID      uint                    `json:"staff_id"`
	TotalAmount float64                 `json:"total_amount"`
	ReadingDate string                  `json:"reading_date"`
	Details     []GarbageDetailResponse `json:"details,omitempty"`
}

// LastWaterReadingResponse ดึงหน่วยค่าน้ำล่าสุดเพื่อเป็นฐานในการจดครั้งถัดไป
type LastWaterReadingResponse struct {
	HouseHoldID uint    `json:"household_id"`
	CurrReading float64 `json:"curr_reading"`
	ReadingDate string  `json:"reading_date"`
}

// LastGarbageReadingResponse ดึงข้อมูลประวัติการจดขยะล่าสุดของครัวเรือน
type LastGarbageReadingResponse struct {
	HouseHoldID uint                    `json:"household_id"`
	ReadingDate string                  `json:"reading_date"`
	TotalAmount float64                 `json:"total_amount"`
	Details     []GarbageDetailResponse `json:"details"`
}


// ToWaterReadingResponse แปลง entity เป็น DTO
func ToWaterReadingResponse(wr *entity.WaterReading) WaterReadingResponse {
	return WaterReadingResponse{
		ID:           wr.ID,
		HouseHoldID:  wr.HouseHoldID,
		StaffID:      wr.StaffID,
		PrevReading:  wr.PrevReading,
		CurrReading:  wr.CurrReading,
		UnitConsumed: wr.UnitConsumed,
		TotalAmount:  wr.TotalAmount,
		ReadingDate:  wr.ReadingDate.Format("2006-01-02 15:04:05"),
	}
}

// ToGarbageReadingResponse แปลง entity เป็น DTO
func ToGarbageReadingResponse(gr *entity.GarbageReading) GarbageReadingResponse {
	var details []GarbageDetailResponse
	for _, d := range gr.GarbageReadingDetails {
		var sizeName string
		var cost float64
		if d.GarbageSize != nil {
			sizeName = d.GarbageSize.SizeName
			cost = d.GarbageSize.Cost
		}
		details = append(details, GarbageDetailResponse{
			ID:            d.ID,
			GarbageSizeID: d.GarbageSizeID,
			SizeName:      sizeName,
			Cost:          cost,
			Amount:        d.Amount,
		})
	}
	return GarbageReadingResponse{
		ID:          gr.ID,
		HouseHoldID: gr.HouseHoldID,
		StaffID:     gr.StaffID,
		TotalAmount: gr.TotalAmount,
		ReadingDate: gr.ReadingDate.Format("2006-01-02 15:04:05"),
		Details:     details,
	}
}
