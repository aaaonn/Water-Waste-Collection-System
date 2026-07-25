package organization

import "backend/entity"

// OrganizationResponse รูปแบบข้อมูลสำหรับส่งกลับไปให้ Frontend
type OrganizationResponse struct {
	SubdistrictID        uint   `json:"subdistrict_id"`
	OrganizationFullName string `json:"organization_full_name"`
	DistrictName         string `json:"district_name"`
	ProvinceName         string `json:"province_name"`

	// Mayor Info
	TitleName   entity.TitleName `json:"title_name"`
	FirstName   string           `json:"first_name"`
	LastName    string           `json:"last_name"`
	PhoneNumber string           `json:"phone_number"`

	// Address Info
	AddressNumber string `json:"address_number"`
	VillageID     *uint  `json:"village_id"`
	VillageNumber int    `json:"village_number"`
	VillageName   string `json:"village_name"`
}

// UpdateOrganizationRequest รูปแบบข้อมูลที่รับมาจาก Frontend สำหรับแก้ไของค์กร
type UpdateOrganizationRequest struct {
	TitleName       entity.TitleName `json:"title_name" valid:"required~Title Name is required"`
	FirstName       string           `json:"first_name" valid:"required~First Name is required"`
	LastName        string           `json:"last_name" valid:"required~Last Name is required"`
	PhoneNumber     string           `json:"phone_number" valid:"required~Phone Number is required,stringlength(10|10)~Phone Number must be 10 digits"`
	AddressNumber   string           `json:"address_number" valid:"required~Address Number is required"`
	VillageID       *uint            `json:"village_id" valid:"required~Village is required"`
	SubdistrictName string           `json:"subdistrict_name" valid:"required~Subdistrict Name is required"`
	DistrictName    string           `json:"district_name" valid:"required~District Name is required"`
	ProvinceName    string           `json:"province_name" valid:"required~Province Name is required"`
}
