package garbage_rate

import "backend/entity"

// CreateGarbageRateRequest DTO สำหรับสร้างอัตราค่าบริการขยะใหม่
type CreateGarbageRateRequest struct {
	SubdistrictID uint    `json:"subdistrict_id" binding:"required"`
	SizeName      string  `json:"size_name" binding:"required,min=2"`
	Cost          float64 `json:"cost" binding:"required,min=0"`
}

// UpdateGarbageRateRequest DTO สำหรับแก้ไขอัตราค่าบริการขยะที่มีอยู่
type UpdateGarbageRateRequest struct {
	SubdistrictID *uint    `json:"subdistrict_id"`
	SizeName      *string  `json:"size_name" binding:"omitempty,min=2"`
	Cost          *float64 `json:"cost" binding:"omitempty,min=0"`
}

// GarbageRateResponse DTO สำหรับตอบกลับข้อมูลอัตราค่าบริการขยะไปยังหน้าจอ
type GarbageRateResponse struct {
	ID              uint    `json:"id"`
	SubdistrictID   uint    `json:"subdistrict_id"`
	SubdistrictName string  `json:"subdistrict_name,omitempty"`
	SizeName        string  `json:"size_name"`
	Cost            float64 `json:"cost"`
}

// ToGarbageRateResponse แปลง Entity ใน DB เป็น Response DTO
func ToGarbageRateResponse(g *entity.GarbageSizeCost) GarbageRateResponse {
	var subdistrictName string
	if g.Subdistrict != nil {
		subdistrictName = g.Subdistrict.SubdistrictName
	}
	return GarbageRateResponse{
		ID:              g.ID,
		SubdistrictID:   g.SubdistrictID,
		SubdistrictName: subdistrictName,
		SizeName:        g.SizeName,
		Cost:            g.Cost,
	}
}

// ToGarbageRateResponseList แปลง Entity List เป็น Response DTO List
func ToGarbageRateResponseList(gs []entity.GarbageSizeCost) []GarbageRateResponse {
	res := make([]GarbageRateResponse, len(gs))
	for i, g := range gs {
		res[i] = ToGarbageRateResponse(&g)
	}
	return res
}
