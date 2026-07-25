package village

import "backend/entity"

// CreateVillageRequest DTO สำหรับสร้างหมู่บ้านใหม่
type CreateVillageRequest struct {
	SubdistrictID      uint   `json:"subdistrict_id" binding:"required"`
	VillageName        string `json:"village_name" binding:"required,min=2"`
	VillageNumber      int    `json:"village_number" binding:"required,min=1"`
	TitleName          string `json:"title_name" binding:"required"`
	HeadmanFirstname   string `json:"headman_firstname" binding:"required,min=2"`
	HeadmanLastname    string `json:"headman_lastname" binding:"required,min=2"`
	NumberHouse        int    `json:"number_house" binding:"required"`
	HeadmanPhoneNumber string `json:"headman_phone_number"`
}

// UpdateVillageRequest DTO สำหรับแก้ไขข้อมูลหมู่บ้าน
type UpdateVillageRequest struct {
	SubdistrictID      *uint   `json:"subdistrict_id"`
	VillageName        *string `json:"village_name" binding:"omitempty,min=2"`
	VillageNumber      *int    `json:"village_number" binding:"omitempty,min=1"`
	TitleName          *string `json:"title_name"`
	HeadmanFirstname   *string `json:"headman_firstname" binding:"omitempty,min=2"`
	HeadmanLastname    *string `json:"headman_lastname" binding:"omitempty,min=2"`
	NumberHouse        *int    `json:"number_house" binding:"omitempty"`
	HeadmanPhoneNumber *string `json:"headman_phone_number"`
}

// VillageResponse DTO สำหรับส่งออกข้อมูลหมู่บ้านไปยัง Frontend
type VillageResponse struct {
	ID                 uint   `json:"id"`
	VillageName        string `json:"village_name"`
	VillageNumber      int    `json:"village_number"`
	SubdistrictID      uint   `json:"subdistrict_id"`
	SubdistrictName    string `json:"subdistrict_name,omitempty"`
	TitleName          string `json:"title_name"`
	HeadmanFirstname   string `json:"headman_firstname"`
	HeadmanLastname    string `json:"headman_lastname"`
	NumberHouse        int    `json:"number_house"`
	HeadmanPhoneNumber string `json:"headman_phone_number"`
}

// ToVillageResponse แปลง Entity ใน DB เป็น Response DTO
func ToVillageResponse(v *entity.Village) VillageResponse {
	var subdistrictName string
	if v.Subdistrict != nil {
		subdistrictName = v.Subdistrict.SubdistrictName
	}
	var titleName string
	var headmanFirstname string
	var headmanLastname string
	var numberHouse int
	var headmanPhoneNumber string
	if v.VillageDetail != nil {
		titleName = string(v.VillageDetail.TitleName)
		headmanFirstname = v.VillageDetail.HeadmanFirstname
		headmanLastname = v.VillageDetail.HeadmanLastname
		numberHouse = v.VillageDetail.NumberHouse
		headmanPhoneNumber = v.VillageDetail.HeadmanPhoneNumber
	}
	return VillageResponse{
		ID:                 v.ID,
		VillageName:        v.VillageName,
		VillageNumber:      v.VillageNumber,
		SubdistrictID:      v.SubdistrictID,
		SubdistrictName:    subdistrictName,
		TitleName:          titleName,
		HeadmanFirstname:   headmanFirstname,
		HeadmanLastname:    headmanLastname,
		NumberHouse:        numberHouse,
		HeadmanPhoneNumber: headmanPhoneNumber,
	}
}

// ToVillageResponseList แปลง Entity List เป็น Response DTO List
func ToVillageResponseList(vs []entity.Village) []VillageResponse {
	res := make([]VillageResponse, len(vs))
	for i, v := range vs {
		res[i] = ToVillageResponse(&v)
	}
	return res
}
