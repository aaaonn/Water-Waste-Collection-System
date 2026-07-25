package invoice

import (
	"time"
	"backend/entity"
)

// InvoiceResponse กำหนดโครงสร้างข้อมูล (Schema) ที่จะส่งกลับไปยัง Frontend
// โดยมีการแปลงข้อมูลจาก Database (Entity) ให้เหมาะสมกับการแสดงผลบนหน้า Dashboard
type InvoiceResponse struct {
	ID                 uint                 `json:"id"`
	HouseHoldID        uint                 `json:"household_id"`
	Status             entity.InvoiceStatus `json:"status"`
	TotalAmount        float64              `json:"total_amount"`
	IssueDate          time.Time            `json:"issue_date"`
	DueDate            time.Time            `json:"due_date"`
	ExternalRef        string               `json:"external_ref"`       // เลขที่อ้างอิงภายนอก
	WaterReadingID     *uint                `json:"water_reading_id"`   // ID ของการจดมิเตอร์น้ำ
	GarbageReadingID   *uint                `json:"garbage_reading_id"` // ID ของการจัดเก็บขยะ
	
	// Preloaded water reading data (ข้อมูลมิเตอร์น้ำที่จะดึงมาแนบด้วย)
	WaterUnitConsumed  float64              `json:"water_unit_consumed"`  // จำนวนหน่วยที่ใช้
	WaterPrevReading   float64              `json:"water_prev_reading"`   // เลขมิเตอร์เดือนก่อนหน้า (เริ่มต้น)
	WaterCurrReading   float64              `json:"water_curr_reading"`   // เลขมิเตอร์เดือนปัจจุบัน (สิ้นสุด)
	WaterReadingAmount float64              `json:"water_reading_amount"` // ยอดเงินค่าน้ำ
}

// ToInvoiceResponse เป็นฟังก์ชันที่ช่วยแปลง entity.Invoice เป็น InvoiceResponse
// เพื่อคัดกรองข้อมูลเฉพาะที่จำเป็นส่งกลับไปให้หน้าบ้าน (Frontend)
func ToInvoiceResponse(i *entity.Invoice) *InvoiceResponse {
	if i == nil {
		return nil
	}
	
	res := &InvoiceResponse{
		ID:               i.ID,
		HouseHoldID:      i.HouseHoldID,
		Status:           i.Status,
		TotalAmount:      i.TotalAmount,
		IssueDate:        i.IssueDate,
		DueDate:          i.DueDate,
		ExternalRef:      i.ExternalRef,
		WaterReadingID:   i.WaterReadingID,
		GarbageReadingID: i.GarbageReadingID,
	}

	if i.WaterReading != nil {
		res.WaterUnitConsumed = i.WaterReading.UnitConsumed
		res.WaterPrevReading = i.WaterReading.PrevReading
		res.WaterCurrReading = i.WaterReading.CurrReading
		res.WaterReadingAmount = i.WaterReading.TotalAmount
	}

	return res
}

// ToInvoiceResponses เป็นฟังก์ชันที่ช่วยแปลง slice ของ entity.Invoice หลายๆ รายการ
// เป็น slice ของ InvoiceResponse เพื่อใช้ตอบกลับในกรณีที่มีหลายบิล (List)
func ToInvoiceResponses(invoices []entity.Invoice) []InvoiceResponse {
	responses := make([]InvoiceResponse, 0, len(invoices))
	for _, i := range invoices {
		res := ToInvoiceResponse(&i)
		if res != nil {
			responses = append(responses, *res)
		}
	}
	return responses
}
