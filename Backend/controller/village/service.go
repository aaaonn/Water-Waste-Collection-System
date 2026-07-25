package village

import (
	"backend/entity"
	"errors"
)

// VillageService อินเตอร์เฟสสำหรับควบคุม Business Logic ของหมู่บ้าน
type VillageService interface {
	GetAll() ([]VillageResponse, error)
	GetByID(id uint) (VillageResponse, error)
	Create(req CreateVillageRequest) (VillageResponse, error)
	Update(id uint, req UpdateVillageRequest) (VillageResponse, error)
	Delete(id uint) error
}

type villageService struct {
	repo VillageRepository
}

// NewVillageService สร้างอินสแตนซ์ของ Service
func NewVillageService(r VillageRepository) VillageService {
	return &villageService{repo: r}
}

// GetAll ดึงข้อมูลหมู่บ้านทั้งหมดส่งไปให้ Handler
func (s *villageService) GetAll() ([]VillageResponse, error) {
	villages, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}
	return ToVillageResponseList(villages), nil
}

// GetByID ค้นหาหมู่บ้านเดี่ยวตาม ID
func (s *villageService) GetByID(id uint) (VillageResponse, error) {
	v, err := s.repo.GetByID(id)
	if err != nil {
		return VillageResponse{}, errors.New("ไม่พบข้อมูลหมู่บ้านที่ระบุ")
	}
	return ToVillageResponse(v), nil
}

// Create รับ DTO มาประมวลผล ตรวจสอบความถูกต้อง แล้วบันทึกหมู่บ้านใหม่
func (s *villageService) Create(req CreateVillageRequest) (VillageResponse, error) {
	// ตรวจสอบหมายเลขหมู่บ้านซ้ำในตำบลเดียวกัน
	existing, err := s.repo.GetByNumberAndSubdistrict(req.VillageNumber, req.SubdistrictID)
	if err == nil && existing != nil {
		return VillageResponse{}, errors.New("หมายเลขหมู่บ้านนี้มีอยู่แล้วในตำบลที่ระบุ")
	}

	newVillage := entity.Village{
		SubdistrictID: req.SubdistrictID,
		VillageName:   req.VillageName,
		VillageNumber: req.VillageNumber,
		VillageDetail: &entity.VillageDetail{
			TitleName:          entity.TitleName(req.TitleName),
			HeadmanFirstname:   req.HeadmanFirstname,
			HeadmanLastname:    req.HeadmanLastname,
			NumberHouse:        req.NumberHouse,
			HeadmanPhoneNumber: req.HeadmanPhoneNumber,
		},
	}

	err = s.repo.Create(&newVillage)
	if err != nil {
		return VillageResponse{}, errors.New("ไม่สามารถเพิ่มข้อมูลหมู่บ้านได้: " + err.Error())
	}

	// โหลดรายละเอียดเพิ่มเติมเพื่อส่งกลับ (เช่น ชื่อตำบล)
	savedVillage, err := s.repo.GetByID(newVillage.ID)
	if err != nil {
		return ToVillageResponse(&newVillage), nil
	}

	return ToVillageResponse(savedVillage), nil
}

// Update แก้ไขเฉพาะจุดที่ร้องขอมาในหมู่บ้านตัวเดิม
func (s *villageService) Update(id uint, req UpdateVillageRequest) (VillageResponse, error) {
	v, err := s.repo.GetByID(id)
	if err != nil {
		return VillageResponse{}, errors.New("ไม่พบข้อมูลหมู่บ้านที่ต้องการแก้ไข")
	}

	// ตรวจสอบหมายเลขหมู่บ้านซ้ำในตำบลเดียวกันเมื่อมีการแก้ไข SubdistrictID หรือ VillageNumber
	newSubdistrictID := v.SubdistrictID
	if req.SubdistrictID != nil {
		newSubdistrictID = *req.SubdistrictID
	}
	newVillageNumber := v.VillageNumber
	if req.VillageNumber != nil {
		newVillageNumber = *req.VillageNumber
	}

	if (req.SubdistrictID != nil && *req.SubdistrictID != v.SubdistrictID) ||
		(req.VillageNumber != nil && *req.VillageNumber != v.VillageNumber) {
		existing, err := s.repo.GetByNumberAndSubdistrict(newVillageNumber, newSubdistrictID)
		if err == nil && existing != nil && existing.ID != v.ID {
			return VillageResponse{}, errors.New("หมายเลขหมู่บ้านนี้มีอยู่แล้วในตำบลที่ระบุ")
		}
	}

	// ตรวจสอบและแก้ไขค่าที่มีการส่งมา (ตัวแปรไม่เป็น nil)
	if req.SubdistrictID != nil {
		v.SubdistrictID = *req.SubdistrictID
	}
	if req.VillageName != nil {
		v.VillageName = *req.VillageName
	}
	if req.VillageNumber != nil {
		v.VillageNumber = *req.VillageNumber
	}

	// ตรวจสอบและอัปเดตข้อมูลรายละเอียดหมู่บ้าน
	if v.VillageDetail == nil {
		v.VillageDetail = &entity.VillageDetail{}
	}
	if req.TitleName != nil {
		v.VillageDetail.TitleName = entity.TitleName(*req.TitleName)
	}
	if req.HeadmanFirstname != nil {
		v.VillageDetail.HeadmanFirstname = *req.HeadmanFirstname
	}
	if req.HeadmanLastname != nil {
		v.VillageDetail.HeadmanLastname = *req.HeadmanLastname
	}
	if req.NumberHouse != nil {
		v.VillageDetail.NumberHouse = *req.NumberHouse
	}
	if req.HeadmanPhoneNumber != nil {
		v.VillageDetail.HeadmanPhoneNumber = *req.HeadmanPhoneNumber
	}

	err = s.repo.Update(v)
	if err != nil {
		return VillageResponse{}, errors.New("ไม่สามารถแก้ไขข้อมูลหมู่บ้านได้: " + err.Error())
	}

	// โหลดข้อมูลล่าสุดส่งกลับไป
	updatedVillage, err := s.repo.GetByID(id)
	if err != nil {
		return ToVillageResponse(v), nil
	}

	return ToVillageResponse(updatedVillage), nil
}

// Delete ตรวจสอบหมู่บ้านก่อนส่งต่อให้ Repo ทำการ Soft Delete
func (s *villageService) Delete(id uint) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("ไม่พบข้อมูลหมู่บ้านที่ต้องการลบ")
	}

	err = s.repo.Delete(id)
	if err != nil {
		return errors.New("ไม่สามารถลบข้อมูลหมู่บ้านได้: " + err.Error())
	}

	return nil
}
