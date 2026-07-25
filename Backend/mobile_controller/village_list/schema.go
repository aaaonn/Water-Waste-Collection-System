package village_list

// VillageResponse DTO สำหรับส่งออกข้อมูลหมู่บ้านไปยัง Frontend
type VillageResponse struct {
	ID                 uint   `json:"id"`
	VillageName        string `json:"village_name"`
	VillageNumber      int    `json:"village_number"`
}

