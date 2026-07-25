package water_unit

import "backend/entity"

// CreateWaterUnitRequest DTO สำหรับสร้างอัตราค่าน้ำใหม่
type CreateWaterUnitRequest struct {
	SubdistrictID uint    `json:"subdistrict_id" binding:"required"`
	StartUnit     float64 `json:"start_unit" binding:"min=0"`
	EndUnit       *float64 `json:"end_unit" binding:"omitempty"`
	Cost          float64 `json:"cost" binding:"min=0"`
}

// UpdateWaterUnitRequest DTO สำหรับแก้ไขอัตราค่าน้ำที่มีอยู่
type UpdateWaterUnitRequest struct {
	SubdistrictID *uint    `json:"subdistrict_id"`
	StartUnit     *float64 `json:"start_unit" binding:"omitempty,min=0"`
	EndUnit       *float64 `json:"end_unit" binding:"omitempty"`
	Cost          *float64 `json:"cost" binding:"omitempty,min=0"`
}

// WaterUnitResponse DTO สำหรับการตอบกลับข้อมูลค่าน้ำประปาที่กระชับและสะอาด
type WaterUnitResponse struct {
	ID              uint    `json:"id"`
	SubdistrictID   uint    `json:"subdistrict_id"`
	SubdistrictName string  `json:"subdistrict_name,omitempty"`
	StartUnit       float64 `json:"start_unit"`
	EndUnit         *float64 `json:"end_unit"`
	Cost            float64 `json:"cost"`
}

// ToWaterUnitResponse แปลง Entity เป็น Response DTO
func ToWaterUnitResponse(wu *entity.WaterUnit) WaterUnitResponse {
	var subdistrictName string
	if wu.Subdistrict != nil {
		subdistrictName = wu.Subdistrict.SubdistrictName
	}
	return WaterUnitResponse{
		ID:              wu.ID,
		SubdistrictID:   wu.SubdistrictID,
		SubdistrictName: subdistrictName,
		StartUnit:       wu.StartUnit,
		EndUnit:         wu.EndUnit,
		Cost:            wu.Cost,
	}
}

// ToWaterUnitResponseList แปลง Entity List เป็น Response DTO List
func ToWaterUnitResponseList(wus []entity.WaterUnit) []WaterUnitResponse {
	res := make([]WaterUnitResponse, len(wus))
	for i, wu := range wus {
		res[i] = ToWaterUnitResponse(&wu)
	}
	return res
}