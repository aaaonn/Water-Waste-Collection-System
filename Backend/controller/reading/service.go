package reading

import (
	"errors"
	"fmt"
	"time"

	"backend/entity"
)

// ReadingService อินเตอร์เฟสสำหรับควบคุม Business Logic ค่าน้ำและค่าขยะ
type ReadingService interface {
	GetLastWaterReading(householdID uint) (*LastWaterReadingResponse, error)
	GetLastGarbageReading(householdID uint) (*LastGarbageReadingResponse, error)
	CreateWaterReading(req CreateWaterReadingRequest) (*WaterReadingResponse, error)
	CreateGarbageReading(req CreateGarbageReadingRequest) (*GarbageReadingResponse, error)
	GetStaffIDByUserID(userID uint) (uint, error)
}

type readingService struct {
	repo ReadingRepository
}

// NewReadingService สร้างอินสแตนซ์ของ Service
func NewReadingService(r ReadingRepository) ReadingService {
	return &readingService{repo: r}
}

func (s *readingService) GetLastWaterReading(householdID uint) (*LastWaterReadingResponse, error) {
	wr, err := s.repo.GetLastWaterReading(householdID)
	if err != nil {
		return nil, err
	}
	if wr == nil {
		return &LastWaterReadingResponse{
			HouseHoldID: householdID,
			CurrReading: 0,
			ReadingDate: "",
		}, nil
	}
	return &LastWaterReadingResponse{
		HouseHoldID: wr.HouseHoldID,
		CurrReading: wr.CurrReading,
		ReadingDate: wr.ReadingDate.Format("2006-01-02 15:04:05"),
	}, nil
}

func (s *readingService) CreateWaterReading(req CreateWaterReadingRequest) (*WaterReadingResponse, error) {
	// 1. ดึงข้อมูลครัวเรือนเพื่อเอาตำบลใช้คำนวณขั้นบันได
	household, err := s.repo.GetHouseholdWithVillage(req.HouseHoldID)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลครัวเรือนที่ระบุในระบบ")
	}

	readingDate := getTargetTime(req.Month, req.Year)
	startOfMonth := time.Date(readingDate.Year(), readingDate.Month(), 1, 0, 0, 0, 0, readingDate.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

	// 2. ดึงมิเตอร์ครั้งล่าสุดก่อนเริ่มเดือนนี้ (สำหรับเป็นค่าอ้างอิงและคำนวณยูนิตใช้จริง)
	lastReading, err := s.repo.GetLastWaterReadingBeforeDate(req.HouseHoldID, startOfMonth)
	if err != nil {
		return nil, err
	}

	prevReading := 0.0
	if lastReading != nil {
		prevReading = lastReading.CurrReading
	}

	// 3. ตรวจสอบความถูกต้องของเลขมิเตอร์ใหม่ (เปรียบเทียบกับมาตรวัดก่อนเริ่มเดือนนี้)
	if req.CurrReading < prevReading {
		return nil, errors.New("เลขมิเตอร์ประปาครั้งใหม่ต้องมากกว่าหรือเท่ากับเลขครั้งก่อน")
	}

	unitConsumed := req.CurrReading - prevReading

	// 4. ดึงหรือตรวจสอบประวัติอัตราค่าน้ำขั้นบันไดประปาของตำบลในรอบเดือน
	var tiersToUse []entity.WaterUnit
	historyTiers, err := s.repo.GetWaterUnitHistory(household.Village.SubdistrictID, req.Month, req.Year)
	if err != nil {
		return nil, err
	}

	if len(historyTiers) > 0 {
		// นำประวัติที่มีอยู่แล้วมาแปลงเป็น WaterUnit เพื่อคำนวณราคา
		tiersToUse = make([]entity.WaterUnit, len(historyTiers))
		for idx, hTier := range historyTiers {
			tiersToUse[idx] = entity.WaterUnit{
				SubdistrictID: hTier.SubdistrictID,
				StartUnit:     hTier.StartUnit,
				EndUnit:       hTier.EndUnit,
				Cost:          hTier.Cost,
			}
		}
	} else {
		// ยังไม่มีประวัติของเดือน/ปีนี้ ให้ดึงจากอัตราปัจจุบันและคัดลอกลงตารางประวัติศาสตร์
		activeTiers, err := s.repo.GetWaterUnitsBySubdistrict(household.Village.SubdistrictID)
		if err != nil {
			return nil, err
		}
		if len(activeTiers) == 0 {
			return nil, errors.New("ไม่พบการตั้งค่าอัตราค่าน้ำประปาขั้นบันไดสำหรับตำบลนี้ในระบบ")
		}

		// บันทึกลงประวัติศาสตร์โดยอัตโนมัติ
		historyList := make([]entity.WaterUnitHistory, len(activeTiers))
		for idx, aTier := range activeTiers {
			historyList[idx] = entity.WaterUnitHistory{
				SubdistrictID: aTier.SubdistrictID,
				StartUnit:     aTier.StartUnit,
				EndUnit:       aTier.EndUnit,
				Cost:          aTier.Cost,
				Month:         req.Month,
				Year:          req.Year,
			}
		}

		err = s.repo.CreateWaterUnitHistory(historyList)
		if err != nil {
			return nil, err
		}

		tiersToUse = activeTiers
	}

	// 5. คำนวณค่าน้ำประปาอัตโนมัติตามแบบอัตราก้าวหน้า (Progressive Rates)
	totalAmount := 0.0
	remaining := unitConsumed

	for _, tier := range tiersToUse {
		if remaining <= 0 {
			break
		}

		// คำนวณความจุยูนิตของขั้นนี้
		var capacity float64
		if tier.EndUnit == nil {
			capacity = remaining // Unlimited tier takes all remaining units!
		} else {
			if tier.StartUnit == 0 {
				capacity = *tier.EndUnit
			} else {
				capacity = *tier.EndUnit - tier.StartUnit + 1
			}
		}

		consumedInTier := 0.0
		if remaining >= capacity {
			consumedInTier = capacity
			remaining -= capacity
		} else {
			consumedInTier = remaining
			remaining = 0
		}

		totalAmount += consumedInTier * tier.Cost
	}

	// 6. บันทึก/อัปเดตข้อมูล WaterReading
	existingWr, err := s.repo.GetWaterReadingByMonthAndYear(req.HouseHoldID, startOfMonth, endOfMonth)
	if err != nil {
		return nil, err
	}

	var wr *entity.WaterReading
	if existingWr != nil {
		// อัปเดตเรคคอร์ดเดิมของเดือนนี้
		existingWr.StaffID = req.StaffID
		existingWr.PrevReading = prevReading
		existingWr.CurrReading = req.CurrReading
		existingWr.UnitConsumed = unitConsumed
		existingWr.TotalAmount = totalAmount
		existingWr.ReadingDate = readingDate
		err = s.repo.UpdateWaterReading(existingWr)
		if err != nil {
			return nil, err
		}
		wr = existingWr
	} else {
		// สร้างเรคคอร์ดใหม่
		wr = &entity.WaterReading{
			HouseHoldID:  req.HouseHoldID,
			StaffID:      req.StaffID,
			PrevReading:  prevReading,
			CurrReading:  req.CurrReading,
			UnitConsumed: unitConsumed,
			ReadingDate:  readingDate,
			TotalAmount:  totalAmount,
		}
		err = s.repo.CreateWaterReading(wr)
		if err != nil {
			return nil, err
		}
	}

	// Create or update Invoice for this month
	invoice, err := s.repo.GetInvoiceByMonthAndYear(req.HouseHoldID, startOfMonth, endOfMonth)
	if err == nil {
		if invoice != nil {
			garbageAmount := 0.0
			if invoice.GarbageReading != nil {
				garbageAmount = invoice.GarbageReading.TotalAmount
			}
			invoice.WaterReadingID = &wr.ID
			invoice.TotalAmount = wr.TotalAmount + garbageAmount
			invoice.Status = entity.InvoicePending
			_ = s.repo.UpdateInvoice(invoice)
		} else {
			issueDate := readingDate
			dueDate := issueDate.AddDate(0, 0, 10)
			externalRef := fmt.Sprintf("INV-%s-%03d", issueDate.Format("200601"), req.HouseHoldID)
			invoice = &entity.Invoice{
				HouseHoldID:    req.HouseHoldID,
				Status:         entity.InvoicePending,
				WaterReadingID: &wr.ID,
				ExternalRef:    externalRef,
				TotalAmount:    wr.TotalAmount,
				IssueDate:      issueDate,
				DueDate:        dueDate,
			}
			_ = s.repo.CreateInvoice(invoice)
		}
	}

	res := ToWaterReadingResponse(wr)
	return &res, nil
}

func (s *readingService) CreateGarbageReading(req CreateGarbageReadingRequest) (*GarbageReadingResponse, error) {
	// if len(req.Details) == 0 {
	// 	return nil, errors.New("กรุณาระบุรายละเอียดขนาดและจำนวนถังขยะอย่างน้อย 1 รายการ")
	// }

	var totalAmount float64
	var details []entity.GarbageReadingDetail
	
	// สำหรับใช้แมปข้อมูล GarbageSize กลับมาแปลง DTO
	sizeCosts := make(map[uint]*entity.GarbageSizeCost)

	for _, d := range req.Details {
		gc, err := s.repo.GetGarbageSizeCost(d.GarbageSizeID)
		if err != nil {
			return nil, errors.New("ไม่พบประเภทหรืออัตราค่าบริการขยะรหัสที่ระบุ")
		}

		totalAmount += gc.Cost * float64(d.Amount)
		
		details = append(details, entity.GarbageReadingDetail{
			GarbageSizeID: d.GarbageSizeID,
			Amount:        d.Amount,
		})

		sizeCosts[d.GarbageSizeID] = gc
	}

	readingDate := getTargetTime(req.Month, req.Year)
	startOfMonth := time.Date(readingDate.Year(), readingDate.Month(), 1, 0, 0, 0, 0, readingDate.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

	existingGr, err := s.repo.GetGarbageReadingByMonthAndYear(req.HouseHoldID, startOfMonth, endOfMonth)
	if err != nil {
		return nil, err
	}

	var gr *entity.GarbageReading
	if existingGr != nil {
		// ลบรายละเอียดถังขยะชุดเดิมเพื่อไม่ให้เกิดขยะซ้ำซ้อน
		err = s.repo.DeleteGarbageReadingDetails(existingGr.ID)
		if err != nil {
			return nil, err
		}

		// อัปเดตข้อมูลในเรคคอร์ดเดิม
		existingGr.StaffID = req.StaffID
		existingGr.ReadingDate = readingDate
		existingGr.TotalAmount = totalAmount
		
		for i := range details {
			details[i].GarbageReadingID = existingGr.ID
		}
		existingGr.GarbageReadingDetails = details

		err = s.repo.UpdateGarbageReading(existingGr)
		if err != nil {
			return nil, err
		}
		gr = existingGr
	} else {
		// สร้างเรคคอร์ดใหม่
		gr = &entity.GarbageReading{
			HouseHoldID:           req.HouseHoldID,
			StaffID:               req.StaffID,
			ReadingDate:           readingDate,
			TotalAmount:           totalAmount,
			GarbageReadingDetails: details,
		}
		err = s.repo.CreateGarbageReading(gr)
		if err != nil {
			return nil, err
		}
	}

	// Create or update Invoice for this month
	invoice, err := s.repo.GetInvoiceByMonthAndYear(req.HouseHoldID, startOfMonth, endOfMonth)
	if err == nil {
		if invoice != nil {
			waterAmount := 0.0
			if invoice.WaterReading != nil {
				waterAmount = invoice.WaterReading.TotalAmount
			}
			invoice.GarbageReadingID = &gr.ID
			invoice.TotalAmount = gr.TotalAmount + waterAmount
			invoice.Status = entity.InvoicePending
			_ = s.repo.UpdateInvoice(invoice)
		} else {
			issueDate := readingDate
			dueDate := issueDate.AddDate(0, 0, 10)
			externalRef := fmt.Sprintf("INV-%s-%03d", issueDate.Format("200601"), req.HouseHoldID)
			invoice = &entity.Invoice{
				HouseHoldID:      req.HouseHoldID,
				Status:           entity.InvoicePending,
				GarbageReadingID: &gr.ID,
				ExternalRef:      externalRef,
				TotalAmount:      gr.TotalAmount,
				IssueDate:        issueDate,
				DueDate:          dueDate,
			}
			_ = s.repo.CreateInvoice(invoice)
		}
	}

	// ผูกความสัมพันธ์ GarbageSize กลับคืนเพื่อใช้ส่งออก DTO Response
	for i := range gr.GarbageReadingDetails {
		gr.GarbageReadingDetails[i].GarbageSize = sizeCosts[gr.GarbageReadingDetails[i].GarbageSizeID]
	}

	res := ToGarbageReadingResponse(gr)
	return &res, nil
}

func (s *readingService) GetLastGarbageReading(householdID uint) (*LastGarbageReadingResponse, error) {
	gr, err := s.repo.GetLastGarbageReading(householdID)
	if err != nil {
		return nil, err
	}
	if gr == nil || len(gr.GarbageReadingDetails) == 0 {
		return &LastGarbageReadingResponse{
			HouseHoldID: householdID,
			ReadingDate: "",
			TotalAmount: 0.0,
			Details:     []GarbageDetailResponse{},
		}, nil
	}

	var details []GarbageDetailResponse
	for _, d := range gr.GarbageReadingDetails {
		var sizeName string
		var cost float64
		if d.GarbageSize != nil {
			sizeName = d.GarbageSize.SizeName
			cost = d.GarbageSize.Cost
		}
		details = append(details, GarbageDetailResponse{
			ID:            d.ID,
			GarbageSizeID: d.GarbageSizeID,
			SizeName:      sizeName,
			Cost:          cost,
			Amount:        d.Amount,
		})
	}

	return &LastGarbageReadingResponse{
		HouseHoldID: gr.HouseHoldID,
		ReadingDate: gr.ReadingDate.Format("2006-01-02 15:04:05"),
		TotalAmount: gr.TotalAmount,
		Details:     details,
	}, nil
}

func (s *readingService) GetStaffIDByUserID(userID uint) (uint, error) {
	return s.repo.GetStaffIDByUserID(userID)
}

func getTargetTime(month, year int) time.Time {
	now := time.Now()
	if month > 0 && year > 0 {
		targetMonth := time.Month(month)
		day := now.Day()
		// check if day exceeds max days in the target month
		t := time.Date(year, targetMonth, 1, 0, 0, 0, 0, now.Location())
		lastDay := t.AddDate(0, 1, 0).Add(-time.Nanosecond).Day()
		if day > lastDay {
			day = lastDay
		}
		return time.Date(year, targetMonth, day, now.Hour(), now.Minute(), now.Second(), 0, now.Location())
	}
	return now
}

