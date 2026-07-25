package village_list

// VillageService อินเตอร์เฟสสำหรับควบคุม Business Logic ของหมู่บ้าน
type VillageService interface {
	GetAll() ([]VillageResponse, error)
}

type mobileVillageService struct {
	repo VillageRepository
}

// NewMobileVillageService สร้างอินสแตนซ์ของ Service
func NewMobileVillageService(r VillageRepository) VillageService {
	return &mobileVillageService{repo: r}
}

// GetAll ดึงข้อมูลหมู่บ้านทั้งหมดส่งไปให้ Handler
func (s *mobileVillageService) GetAll() ([]VillageResponse, error) {
	villages, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	var response []VillageResponse

	for _, v := range villages {
		res := VillageResponse{
			ID:            v.ID,
			VillageName:   v.VillageName,   // แมปเข้าฟิลด์ VillageName
			VillageNumber: v.VillageNumber, // แมปเข้าฟิลด์ VillageNumber
		}
		response = append(response, res)
	}

	return response, nil
}
