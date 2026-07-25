package organization

// OrganizationService กำหนดฟังก์ชันสำหรับจัดการ Business Logic ขององค์กร
type OrganizationService interface {
	GetOrganization() (*OrganizationResponse, error)
	UpdateOrganization(req *UpdateOrganizationRequest) error
}

type organizationService struct {
	repo OrganizationRepository
}

func NewOrganizationService(repo OrganizationRepository) OrganizationService {
	return &organizationService{repo: repo}
}

// GetOrganization ดึงข้อมูลและจัดการรูปแบบข้อมูลให้พร้อมส่งกลับไปที่ Frontend
func (s *organizationService) GetOrganization() (*OrganizationResponse, error) {
	subdistrict, err := s.repo.GetOrganization()
	if err != nil {
		return nil, err
	}

	response := &OrganizationResponse{
		SubdistrictID:        subdistrict.ID,
		OrganizationFullName: "องค์การบริหารส่วนตำบล" + subdistrict.SubdistrictName,
	}

	if subdistrict.District != nil {
		response.DistrictName = subdistrict.District.DistrictName
		if subdistrict.District.Province != nil {
			response.ProvinceName = subdistrict.District.Province.ProvinceName
		}
	}

	// Map Address Info from Subdistrict
	response.AddressNumber = subdistrict.AddressNumber
	if subdistrict.VillageID != nil {
		response.VillageID = subdistrict.VillageID
		// ค้นหาหมู่บ้านจาก ID
		if village, err := s.repo.GetVillageByID(*subdistrict.VillageID); err == nil {
			response.VillageNumber = village.VillageNumber
			response.VillageName = village.VillageName
		}
	}

	// Map Mayor Info from SubdistrictInfo
	if subdistrict.SubdistrictInfo != nil {
		info := subdistrict.SubdistrictInfo
		response.TitleName = info.TitleName
		response.FirstName = info.FirstName
		response.LastName = info.LastName
		response.PhoneNumber = info.PhoneNumber
	}

	return response, nil
}

// UpdateOrganization ตรวจสอบและส่งต่อข้อมูลที่ต้องการอัปเดตไปที่ Repository
func (s *organizationService) UpdateOrganization(req *UpdateOrganizationRequest) error {
	// ดึง ID ของตำบลหลักมาก่อน เนื่องจากระบบนี้มีแค่ตำบลเดียว
	subdistrict, err := s.repo.GetOrganization()
	if err != nil {
		return err
	}

	return s.repo.UpdateOrganizationInfo(subdistrict.ID, req)
}
