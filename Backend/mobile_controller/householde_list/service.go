package householde_list

import (
	"backend/entity"
	"fmt"
	"strings"
	"time"
)

type MobileHouseholdService interface {
	GetMobileHouseholds(subdistrictID uint, req MobileHouseholdRequest) ([]MobileHouseholdResponse, error)
	GetMobileHouseholdByID(householdID uint, subdistrictID uint, month int, year int) (*MobileHouseholdDetailResponse, error)
}

type mobileHouseholdService struct {
	repo MobileHouseholdRepository
}

func NewMobileHouseholdService(r MobileHouseholdRepository) MobileHouseholdService {
	return &mobileHouseholdService{repo: r}
}

func (s *mobileHouseholdService) GetMobileHouseholds(subdistrictID uint, req MobileHouseholdRequest) ([]MobileHouseholdResponse, error) {
	// 1. คำนวณช่วงวันเริ่มต้นและสิ้นสุดของรอบบิลเดือนที่กำหนด
	startOfMonth := time.Date(req.Year, time.Month(req.Month), 1, 0, 0, 0, 0, time.Local)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	// 2. ดึงข้อมูลครัวเรือนทั้งหมดของตำบลนี้
	households, err := s.repo.GetHouseholdsBySubdistrict(subdistrictID)
	if err != nil {
		return nil, err
	}

	// 3. ดึงรายการใบแจ้งหนี้ทั้งหมดในเดือนที่พนักงานเลือก
	invoices, err := s.repo.GetInvoicesByMonthAndYear(startOfMonth, endOfMonth)
	if err != nil {
		return nil, err
	}

	// 4. แผนผังแมป HouseholdID เข้าหา Invoice เพื่อการค้นหาด้วยความเร็ว O(1)
	invoiceMap := make(map[uint]entity.Invoice)
	for _, inv := range invoices {
		invoiceMap[inv.HouseHoldID] = inv
	}

	var responseList []MobileHouseholdResponse

	// 5. วนลูปประมวลผลจัดกลุ่มสถานะทีละครัวเรือน
	for _, h := range households {
		// กรองขั้นแรก: ถ้าฟิลเตอร์ระบุหมู่บ้าน (VillageID > 0) และรหัสไม่ตรงกัน ให้ข้าม
		if req.VillageID > 0 && h.VillageID != req.VillageID {
			continue
		}

		// คำนวณหาตรวจสอบสถานะตามกฎธุรกิจ (Survey & Payment Resolution Logic)
		var calculatedStatus string
		_, hasInvoice := invoiceMap[h.ID]
		if !hasInvoice {
			calculatedStatus = "not_surveyed" // ยังไม่ได้ทำบิล = ยังไม่สำรวจ
		} else {
			inv := invoiceMap[h.ID]
			if inv.Status == entity.InvoicePaid {
				calculatedStatus = "paid" // ชำระแล้ว
			} else {
				calculatedStatus = "unpaid" // ค้างชำระ (เช่น pending, overdue)
			}
		}

		// กรองขั้นสอง: ถ้าฟิลเตอร์ระบุสถานะเฉพาะ (ที่ไม่ใช่ all) และสถานะไม่ตรงกัน ให้ข้าม
		if req.Status != "" && req.Status != "all" && calculatedStatus != req.Status {
			continue
		}

		// สรุปชื่อเจ้าบ้าน
		ownerName := fmt.Sprintf("%s%s %s", h.TitleName, h.FirstName, h.LastName)

		// กรองขั้นสาม: ตรวจสอบคำสืบค้นค้นหา (Query Search)
		if req.Query != "" {
			searchQuery := strings.ToLower(req.Query)
			matchHouseCode := strings.Contains(strings.ToLower(h.HouseCode), searchQuery)
			matchOwnerName := strings.Contains(strings.ToLower(ownerName), searchQuery)
			matchPhone := strings.Contains(h.PhoneNumber, searchQuery)
			matchWaterID := strings.Contains(strings.ToLower(h.WaterUserID), searchQuery)

			if !matchHouseCode && !matchOwnerName && !matchPhone && !matchWaterID {
				continue
			}
		}

		// ดึงข้อมูลหมู่บ้าน
		villageName := ""
		villageNum := 0
		if h.Village != nil {
			villageName = h.Village.VillageName
			villageNum = h.Village.VillageNumber
		}

		// นำบ้านที่ตรงตามเกณฑ์ทุกอย่าง แมปเป็นโครงสร้างข้อมูลตอบกลับ
		responseList = append(responseList, MobileHouseholdResponse{
			ID:            h.ID,
			HouseNumber:   h.HouseNumber,
			OwnerName:     ownerName,
			VillageName:   villageName,
			VillageNumber: villageNum,
			Status:        calculatedStatus,
		})
	}

	return responseList, nil
}

func (s *mobileHouseholdService) GetMobileHouseholdByID(householdID uint, subdistrictID uint, month int, year int) (*MobileHouseholdDetailResponse, error) {
	h, err := s.repo.GetHouseholdByID(householdID, subdistrictID)
	if err != nil {
		return nil, err
	}

	// 1. คำนวณช่วงวันเริ่มต้นและสิ้นสุดของรอบบิลเดือนที่กำหนด
	startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	// 2. ค้นหา Invoice ในรอบบิล
	var currentInvoice *entity.Invoice
	for _, inv := range h.Invoices {
		if inv.IssueDate.After(startOfMonth.Add(-time.Second)) && inv.IssueDate.Before(endOfMonth.Add(time.Second)) && inv.Status != entity.InvoiceCancelled {
			currentInvoice = &inv
			break
		}
	}

	villageName := ""
	villageNum := 0
	subdistrictName := ""
	districtName := ""
	provinceName := ""
	if h.Village != nil {
		villageName = h.Village.VillageName
		villageNum = h.Village.VillageNumber
		if h.Village.Subdistrict != nil {
			subdistrictName = h.Village.Subdistrict.SubdistrictName
			if h.Village.Subdistrict.District != nil {
				districtName = h.Village.Subdistrict.District.DistrictName
				if h.Village.Subdistrict.District.Province != nil {
					provinceName = h.Village.Subdistrict.District.Province.ProvinceName
				}
			}
		}
	}

	ownerName := fmt.Sprintf("%s%s %s", h.TitleName, h.FirstName, h.LastName)

	// 3. คำนวณค่าน้ำประปา ค่าบริการ และมาตรวัดน้ำ
	var previousMeter float64
	var currentMeter *float64
	garbageBins := map[string]int{}
	var waterBillAmount float64
	var garbageBillAmount float64
	var totalAmount float64

	if currentInvoice != nil {
		totalAmount = currentInvoice.TotalAmount
		
		// 3.1 ค่าน้ำประปา: ถ้ามีบิลในรอบเดือนแล้ว ให้ดึงข้อมูลมาแสดงผล
		if currentInvoice.WaterReading != nil {
			previousMeter = currentInvoice.WaterReading.PrevReading
			currVal := currentInvoice.WaterReading.CurrReading
			currentMeter = &currVal
			waterBillAmount = currentInvoice.WaterReading.TotalAmount
		} else {
			// ถ้ายังไม่ได้จดของรอบเดือนนี้ ให้ดึงค่าจากประวัติมาตรล่าสุดเป็นค่าเริ่มต้น
			if len(h.WaterReadings) > 0 {
				previousMeter = h.WaterReadings[0].CurrReading
			} else {
				previousMeter = 0.0
			}
		}

		// 3.2 ค่าธรรมเนียมขยะ: ถ้ามีบันทึกในรอบเดือนนี้แล้ว ให้ดึงมาแสดงผล
		if currentInvoice.GarbageReading != nil {
			garbageBillAmount = currentInvoice.GarbageReading.TotalAmount
			for _, detail := range currentInvoice.GarbageReading.GarbageReadingDetails {
				if detail.GarbageSize != nil {
					garbageBins[mapSizeNameToKey(detail.GarbageSize.SizeName)] = detail.Amount
				}
			}
		} else {
			// หากไม่มีบิลขยะของเดือนนี้ ให้ดึงประวัติถังขยะเดิมของเดือนก่อนหน้า (ล่าสุด) มาแสดงเป็นค่าเริ่มต้น
			if len(h.GarbageReadings) > 0 && len(h.GarbageReadings[0].GarbageReadingDetails) > 0 {
				for _, detail := range h.GarbageReadings[0].GarbageReadingDetails {
					if detail.GarbageSize != nil {
						garbageBins[mapSizeNameToKey(detail.GarbageSize.SizeName)] = detail.Amount
					}
				}
			} else {
				garbageBins["20L"] = 1 // กรณีไม่มีข้อมูลถังขยะเดิมเลย ให้ตั้งค่าเริ่มต้นเป็นขนาด 20 ลิตร 1 ถัง
			}
		}
	} else {
		// ยังไม่มี Invoice: ให้หามาตรจดหน่วยน้ำประปาล่าสุดของครัวเรือนนี้
		if len(h.WaterReadings) > 0 {
			previousMeter = h.WaterReadings[0].CurrReading
		} else {
			previousMeter = 0.0
		}

		// ดึงข้อมูลประเภทถังขยะเดิมของเดือนก่อนหน้า (ล่าสุด) มาเป็นค่าเริ่มต้น
		if len(h.GarbageReadings) > 0 && len(h.GarbageReadings[0].GarbageReadingDetails) > 0 {
			for _, detail := range h.GarbageReadings[0].GarbageReadingDetails {
				if detail.GarbageSize != nil {
					garbageBins[mapSizeNameToKey(detail.GarbageSize.SizeName)] = detail.Amount
				}
			}
		} else {
			garbageBins["20L"] = 1 // กรณีไม่มีข้อมูลถังขยะเดิมเลย ให้ตั้งค่าเริ่มต้นเป็นขนาด 20 ลิตร 1 ถัง
		}
	}

	var calculatedStatus string = "not_surveyed"
	if currentInvoice != nil {
		if currentInvoice.Status == entity.InvoicePaid {
			calculatedStatus = "paid"
		} else {
			calculatedStatus = "unpaid"
		}
	}

	resp := &MobileHouseholdDetailResponse{
		ID:                h.ID,
		VillageID:         h.VillageID,
		HouseNumber:       h.HouseNumber,
		HouseCode:         h.HouseCode,
		OwnerName:         ownerName,
		CitizenID:         h.CitizenID,
		PhoneNumber:       h.PhoneNumber,
		WaterUserID:       h.WaterUserID,
		WaterStatus:       string(h.WaterStatus),
		GarbageStatus:     string(h.GarbageStatus),
		Status:            calculatedStatus,
		VillageName:       villageName,
		VillageNumber:     villageNum,
		SubdistrictName:   subdistrictName,
		DistrictName:      districtName,
		ProvinceName:      provinceName,
		PreviousMeter:     previousMeter,
		CurrentMeter:      currentMeter,
		GarbageBins:       garbageBins,
		WaterBillAmount:   waterBillAmount,
		GarbageBillAmount: garbageBillAmount,
		TotalAmount:       totalAmount,
	}

	return resp, nil
}

func mapSizeNameToKey(sizeName string) string {
	if strings.Contains(sizeName, "20L") {
		return "20L"
	}
	if strings.Contains(sizeName, "50L") || strings.Contains(sizeName, "60L") {
		return "60L"
	}
	if strings.Contains(sizeName, "100L") || strings.Contains(sizeName, "120L") {
		return "120L"
	}
	return sizeName
}
