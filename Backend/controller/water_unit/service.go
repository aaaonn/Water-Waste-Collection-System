package water_unit

import (
	"backend/entity"
	"errors"
)

// WaterUnitService อินเตอร์เฟสสำหรับควบคุม Business Logic ค่าน้ำประป
type WaterUnitService interface {
	Create(req CreateWaterUnitRequest) (*WaterUnitResponse, error)
	GetByID(id uint) (*WaterUnitResponse, error)
	GetAll(subdistrictID uint, month *int, year *int) ([]WaterUnitResponse, error)
	Update(id uint, req UpdateWaterUnitRequest) (*WaterUnitResponse, error)
	Delete(id uint) error
}

type waterUnitService struct {
	repo WaterUnitRepository
}

// NewWaterUnitService สร้างอินสแตนซ์ของ Service
func NewWaterUnitService(r WaterUnitRepository) WaterUnitService {
	return &waterUnitService{repo: r}
}

func (s *waterUnitService) Create(req CreateWaterUnitRequest) (*WaterUnitResponse, error) {
	// 1. ตรวจสอบว่าตำบลที่ส่งมามีอยู่จริง
	exists, err := s.repo.SubdistrictExists(req.SubdistrictID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("ไม่พบข้อมูลตำบลที่ระบุในระบบ")
	}

	// 2. ตรวจสอบว่าช่วง EndUnit ต้องมากกว่าหรือเท่ากับ StartUnit
	if req.EndUnit == nil {
		req.EndUnit = nil
	}else if *req.EndUnit < req.StartUnit {
		return nil, errors.New("หน่วยสิ้นสุดต้องมีค่ามากกว่าหรือเท่ากับหน่วยเริ่มต้น")
		
	}

	// 3. ตรวจสอบการทับซ้อนของขั้นบันไดค่าน้ำในตำบลเดียวกัน
	endUnitValue := 999999.0
	if req.EndUnit != nil {
		endUnitValue = *req.EndUnit
	}
	overlap, err := s.repo.CheckOverlap(req.SubdistrictID, req.StartUnit, endUnitValue, 0)
	if err != nil {
		return nil, err
	}
	if overlap {
		return nil, errors.New("ช่วงของหน่วยน้ำประปานี้ซ้อนทับกับช่วงข้อมูลที่มีอยู่แล้วในระบบของตำบลนี้")
	}

	// 4. บันทึกข้อมูล
	waterUnit := &entity.WaterUnit{
		SubdistrictID: req.SubdistrictID,
		StartUnit:     req.StartUnit,
		EndUnit:       req.EndUnit,
		Cost:          req.Cost,
	}

	err = s.repo.Create(waterUnit)
	if err != nil {
		return nil, err
	}

	// โหลดข้อมูลความสัมพันธ์ (Preload) และแปลงเป็น DTO ส่งกลับไป
	wu, err := s.repo.GetByID(waterUnit.ID)
	if err != nil {
		return nil, err
	}

	res := ToWaterUnitResponse(wu)
	return &res, nil
}

func (s *waterUnitService) GetByID(id uint) (*WaterUnitResponse, error) {
	waterUnit, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลอัตราค่าน้ำที่ระบุ")
	}
	res := ToWaterUnitResponse(waterUnit)
	return &res, nil
}

func (s *waterUnitService) GetAll(subdistrictID uint, month *int, year *int) ([]WaterUnitResponse, error) {
	if month != nil && year != nil {
		history, err := s.repo.GetHistory(subdistrictID, *month, *year)
		if err == nil && len(history) > 0 {
			res := make([]WaterUnitResponse, len(history))
			for idx, h := range history {
				res[idx] = WaterUnitResponse{
					ID:            h.ID,
					SubdistrictID: h.SubdistrictID,
					StartUnit:     h.StartUnit,
					EndUnit:       h.EndUnit,
					Cost:          h.Cost,
				}
			}
			return res, nil
		}
	}

	wus, err := s.repo.GetAll(subdistrictID)
	if err != nil {
		return nil, err
	}
	return ToWaterUnitResponseList(wus), nil
}

func (s *waterUnitService) Update(id uint, req UpdateWaterUnitRequest) (*WaterUnitResponse, error) {
	// 1. ตรวจสอบว่ามีข้อมูลเดิมอยู่จริงหรือไม่
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลอัตราค่าน้ำประปาที่ระบุ")
	}

	// 2. อัปเดตข้อมูลและเตรียมตรวจสอบเงื่อนไขความถูกต้อง
	subdistrictID := existing.SubdistrictID
	if req.SubdistrictID != nil {
		subdistrictID = *req.SubdistrictID
		// ตรวจสอบว่าตำบลใหม่มีอยู่จริง
		exists, err := s.repo.SubdistrictExists(subdistrictID)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, errors.New("ไม่พบข้อมูลตำบลที่ระบุในระบบ")
		}
	}

	startUnit := existing.StartUnit
	if req.StartUnit != nil {
		startUnit = *req.StartUnit
	}

	// Since the Next.js frontend always sends the full request body (all fields present),
	// we directly assign the EndUnit pointer (which will be nil if unlimited/empty).
	existing.EndUnit = req.EndUnit
	endUnit := existing.EndUnit

	cost := existing.Cost
	if req.Cost != nil {
		cost = *req.Cost
	}

	// 3. ตรวจสอบเงื่อนไขช่วงค่าตัวเลขที่ถูกต้อง
	if endUnit != nil && *endUnit < startUnit {
		return nil, errors.New("หน่วยสิ้นสุดต้องมีค่ามากกว่าหรือเท่ากับหน่วยเริ่มต้น")
	}

	// 4. ตรวจสอบการทับซ้อนของขั้นบันไดค่าน้ำในตำบลเดียวกัน (ยกเว้น ID ปัจจุบัน)
	endUnitValue := 999999.0
	if endUnit != nil {
		endUnitValue = *endUnit
	}
	overlap, err := s.repo.CheckOverlap(subdistrictID, startUnit, endUnitValue, id)
	if err != nil {
		return nil, err
	}
	if overlap {
		return nil, errors.New("ช่วงของหน่วยน้ำประปานี้ซ้อนทับกับช่วงข้อมูลที่มีอยู่แล้วในระบบของตำบลนี้")
	}

	// 5. อัปเดตค่าฟิลด์
	existing.SubdistrictID = subdistrictID
	existing.StartUnit = startUnit
	existing.EndUnit = endUnit
	existing.Cost = cost

	err = s.repo.Update(existing)
	if err != nil {
		return nil, err
	}

	// โหลดข้อมูลความสัมพันธ์ (Preload) และแปลงเป็น DTO ส่งกลับไป
	wu, err := s.repo.GetByID(existing.ID)
	if err != nil {
		return nil, err
	}

	res := ToWaterUnitResponse(wu)
	return &res, nil
}

func (s *waterUnitService) Delete(id uint) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("ไม่พบข้อมูลอัตราค่าน้ำประปาที่ระบุสำหรับการลบ")
	}
	return s.repo.Delete(id)
}