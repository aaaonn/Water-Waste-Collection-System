package householde_list

// MobileHouseholdRequest พารามิเตอร์สำหรับฟิลเตอร์และค้นหาข้อมูล
type MobileHouseholdRequest struct {
	VillageID uint   `form:"village_id" json:"village_id"`
	Month     int    `form:"month" json:"month" binding:"required,min=1,max=12"`
	Year      int    `form:"year" json:"year" binding:"required"`
	Status    string `form:"status" json:"status"` // all, not_surveyed, unpaid, paid
	Query     string `form:"query" json:"query"`   // ค้นหาตามเลขที่บ้าน หรือชื่อผู้ใช้บริการ
}

// MobileHouseholdResponse ข้อมูลครัวเรือนที่จัดแต่งเพื่อแอปมือถือโดยเฉพาะ
type MobileHouseholdResponse struct {
	ID            uint   `json:"id"`
	HouseNumber   string `json:"house_number"`   // เช่น "124"
	OwnerName     string `json:"owner_name"`     // ชื่อรวม (เช่น นายสมเกียรติ ยอดงาม)
	VillageName   string `json:"village_name"`   // เช่น บ้านปราสาทเบง
	VillageNumber int    `json:"village_number"` // หมู่ที่ (เช่น 1)
	Status        string `json:"status"`         // not_surveyed, unpaid, paid
}

// MobileHouseholdDetailResponse ข้อมูลครัวเรือนโดยละเอียด สำหรับแอปมือถือ
type MobileHouseholdDetailResponse struct {
	ID              uint           `json:"id"`
	VillageID       uint           `json:"village_id"`
	HouseNumber     string         `json:"house_number"`
	HouseCode       string         `json:"house_code"`
	OwnerName       string         `json:"owner_name"`
	CitizenID       string         `json:"citizen_id"`
	PhoneNumber     string         `json:"phone_number"`
	WaterUserID     string         `json:"water_user_id"`
	WaterStatus     string         `json:"water_status"`
	GarbageStatus   string         `json:"garbage_status"`
	Status          string         `json:"status"` // not_surveyed, unpaid, paid
	VillageName     string         `json:"village_name"`
	VillageNumber   int            `json:"village_number"`
	SubdistrictName string         `json:"subdistrict_name"`
	DistrictName    string         `json:"district_name"`
	ProvinceName    string         `json:"province_name"`
	PreviousMeter     float64        `json:"previous_meter"`
	CurrentMeter      *float64       `json:"current_meter"`
	GarbageBins       map[string]int `json:"garbage_bins"`
	WaterBillAmount   float64        `json:"water_bill_amount"`
	GarbageBillAmount float64        `json:"garbage_bill_amount"`
	TotalAmount       float64        `json:"total_amount"`
}
