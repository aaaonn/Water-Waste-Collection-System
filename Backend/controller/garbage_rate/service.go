package garbage_rate

import (
	"backend/entity"
	"errors"
)

// GarbageRateService อินเตอร์เฟสสำหรับควบคุม Business Logic ของอัตราค่าขยะ
type GarbageRateService interface {
	GetAll(subdistrictID uint) ([]GarbageRateResponse, error)
	GetByID(id uint) (GarbageRateResponse, error)
	Create(req CreateGarbageRateRequest) (GarbageRateResponse, error)
	Update(id uint, req UpdateGarbageRateRequest) (GarbageRateResponse, error)
	Delete(id uint) error
}

type garbageRateService struct {
	repo GarbageRateRepository
}

// NewGarbageRateService สร้างอินสแตนซ์ของ Service
func NewGarbageRateService(r GarbageRateRepository) GarbageRateService {
	return &garbageRateService{repo: r}
}

// GetAll ดึงข้อมูลทั้งหมดและแปลงเป็น DTO
func (s *garbageRateService) GetAll(subdistrictID uint) ([]GarbageRateResponse, error) {
	list, err := s.repo.GetAll(subdistrictID)
	if err != nil {
		return nil, err
	}
	return ToGarbageRateResponseList(list), nil
}

// GetByID ค้นหาตาม ID และแปลงเป็น DTO
func (s *garbageRateService) GetByID(id uint) (GarbageRateResponse, error) {
	g, err := s.repo.GetByID(id)
	if err != nil {
		return GarbageRateResponse{}, errors.New("ไม่พบข้อมูลอัตราค่าบริการขยะที่ระบุ")
	}
	return ToGarbageRateResponse(g), nil
}

// Create ตรวจสอบและบันทึกอัตราค่าบริการขยะใหม่
func (s *garbageRateService) Create(req CreateGarbageRateRequest) (GarbageRateResponse, error) {
	// ตรวจสอบชื่อขนาดซ้ำกันในตำบลเดียวกัน
	existing, err := s.repo.GetBySizeAndSubdistrict(req.SizeName, req.SubdistrictID)
	if err == nil && existing != nil {
		return GarbageRateResponse{}, errors.New("มีอัตราค่าบริการขยะสำหรับขนาดถังนี้ในตำบลที่เลือกอยู่แล้ว")
	}

	newRate := entity.GarbageSizeCost{
		SubdistrictID: req.SubdistrictID,
		SizeName:      req.SizeName,
		Cost:          req.Cost,
	}

	err = s.repo.Create(&newRate)
	if err != nil {
		return GarbageRateResponse{}, errors.New("ไม่สามารถเพิ่มข้อมูลได้: " + err.Error())
	}

	savedRate, err := s.repo.GetByID(newRate.ID)
	if err != nil {
		return ToGarbageRateResponse(&newRate), nil
	}
	return ToGarbageRateResponse(savedRate), nil
}

// Update ตรวจสอบและอัปเดตอัตราค่าบริการขยะเดิม
func (s *garbageRateService) Update(id uint, req UpdateGarbageRateRequest) (GarbageRateResponse, error) {
	g, err := s.repo.GetByID(id)
	if err != nil {
		return GarbageRateResponse{}, errors.New("ไม่พบข้อมูลอัตราค่าบริการขยะที่ต้องการแก้ไข")
	}

	// เตรียมค่าเพื่อการตรวจสอบความซ้ำซ้อน
	newSubdistrictID := g.SubdistrictID
	if req.SubdistrictID != nil {
		newSubdistrictID = *req.SubdistrictID
	}
	newSizeName := g.SizeName
	if req.SizeName != nil {
		newSizeName = *req.SizeName
	}

	// ตรวจสอบหากมีการแก้ไขขนาดถังขยะหรือรหัสตำบล
	if (req.SubdistrictID != nil && *req.SubdistrictID != g.SubdistrictID) ||
		(req.SizeName != nil && *req.SizeName != g.SizeName) {
		existing, err := s.repo.GetBySizeAndSubdistrict(newSizeName, newSubdistrictID)
		if err == nil && existing != nil && existing.ID != g.ID {
			return GarbageRateResponse{}, errors.New("มีอัตราค่าบริการขยะสำหรับขนาดถังนี้ในตำบลที่เลือกอยู่แล้ว")
		}
	}

	// บันทึกการเปลี่ยนแปลงค่า
	if req.SubdistrictID != nil {
		g.SubdistrictID = *req.SubdistrictID
	}
	if req.SizeName != nil {
		g.SizeName = *req.SizeName
	}
	if req.Cost != nil {
		g.Cost = *req.Cost
	}

	err = s.repo.Update(g)
	if err != nil {
		return GarbageRateResponse{}, errors.New("ไม่สามารถแก้ไขข้อมูลได้: " + err.Error())
	}

	updatedRate, err := s.repo.GetByID(id)
	if err != nil {
		return ToGarbageRateResponse(g), nil
	}
	return ToGarbageRateResponse(updatedRate), nil
}

// Delete ตรวจสอบตัวตนก่อนเรียก Delete ใน repository (Soft Delete)
func (s *garbageRateService) Delete(id uint) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("ไม่พบข้อมูลอัตราค่าบริการขยะที่ต้องการลบ")
	}

	err = s.repo.Delete(id)
	if err != nil {
		return errors.New("ไม่สามารถลบข้อมูลได้: " + err.Error())
	}
	return nil
}
