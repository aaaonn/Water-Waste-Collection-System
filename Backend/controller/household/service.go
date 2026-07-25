package household

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/entity"
	"backend/utils"
)

// HouseholdService อินเตอร์เฟสสำหรับควบคุม Business Logic ของครัวเรือน
type HouseholdService interface {
	GetAll() ([]HouseholdResponse, error)
	GetByID(id uint) (*HouseholdResponse, error)
	GetByVillageID(villageID uint, month int, year int) ([]HouseholdResponse, error)
	Create(req CreateHouseholdRequest) (*HouseholdResponse, error)
	Update(id uint, req UpdateHouseholdRequest) (*HouseholdResponse, error)
	Delete(id uint) error
	GetByLoginID(loginID uint) (*HouseholdResponse, error)
	Import(reqs []CreateHouseholdRequest) ImportHouseholdResponse
}

type householdService struct {
	repo HouseholdRepository
}

// NewHouseholdService สร้างอินสแตนซ์ของ Service
func NewHouseholdService(r HouseholdRepository) HouseholdService {
	return &householdService{repo: r}
}

// GetAll ค้นหาครัวเรือนทั้งหมดในระบบ
func (s *householdService) GetAll() ([]HouseholdResponse, error) {
	// 1. ดึงข้อมูลครัวเรือนทั้งหมดจากฐานข้อมูล
	households, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	var res []HouseholdResponse
	for _, h := range households {
		isWaterRecorded, isGarbageRecorded, err := s.repo.CheckRecordedThisMonth(h.ID)
		if err != nil {
			return nil, err
		}
		res = append(res, ToHouseholdResponse(&h, isWaterRecorded, isGarbageRecorded))
	}
	return res, nil
}

// GetByID ค้นหาข้อมูลครัวเรือน 1 รายการ
func (s *householdService) GetByID(id uint) (*HouseholdResponse, error) {
	household, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	isWater, isGarbage, _ := s.repo.CheckRecordedThisMonth(id)
	res := ToHouseholdResponse(household, isWater, isGarbage)
	return &res, nil
}

// GetByLoginID ค้นหาข้อมูลครัวเรือนตาม Login ID
func (s *householdService) GetByLoginID(loginID uint) (*HouseholdResponse, error) {
	household, err := s.repo.GetByLoginID(loginID)
	if err != nil {
		return nil, err
	}
	isWater, isGarbage, _ := s.repo.CheckRecordedThisMonth(household.ID)
	res := ToHouseholdResponse(household, isWater, isGarbage)
	return &res, nil
}

// GetByVillageID ค้นหาครัวเรือนทั้งหมดที่อยู่ในหมู่บ้านที่ระบุ
func (s *householdService) GetByVillageID(villageID uint, month int, year int) ([]HouseholdResponse, error) {
	// 1. ดึงข้อมูลครัวเรือนทั้งหมดจากฐานข้อมูลตาม ID ของหมู่บ้าน
	households, err := s.repo.GetByVillageID(villageID)
	if err != nil {
		return nil, err
	}

	var res []HouseholdResponse
	for _, h := range households {
		isWaterRecorded, isGarbageRecorded, err := s.repo.CheckRecordedMonth(h.ID, month, year)
		if err != nil {
			return nil, err
		}

		var wr *entity.WaterReading
		var gr *entity.GarbageReading
		if isWaterRecorded {
			wr, err = s.repo.GetWaterReadingByMonth(h.ID, month, year)
			if err != nil {
				return nil, err
			}
		}
		if isGarbageRecorded {
			gr, err = s.repo.GetGarbageReadingByMonth(h.ID, month, year)
			if err != nil {
				return nil, err
			}
		}

		res = append(res, ToHouseholdResponseWithReadings(&h, isWaterRecorded, isGarbageRecorded, wr, gr))
	}
	return res, nil
}

// Create สร้างข้อมูลครัวเรือนใหม่ พร้อมกับสร้างบัญชีผู้ใช้งาน (Login) ให้อัตโนมัติ
func (s *householdService) Create(req CreateHouseholdRequest) (*HouseholdResponse, error) {
	// 1. ดึงข้อมูลหมู่บ้าน เพื่อนำไปใช้สร้างรหัสผ่าน (หมู่ที่) และเชื่อมโยงตำบล (SubdistrictID)
	village, err := s.repo.GetVillageByID(req.VillageID)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลหมู่บ้าน (VillageID) ที่ระบุในระบบ")
	}

	// 2. ตั้งค่า Username เป็น บ้านเลขที่-หมู่ที่ (เช่น 123-4)
	usernameStr := fmt.Sprintf("%s-%d", req.HouseNumber, village.VillageNumber)
	
	// 3. ทำการเข้ารหัส (Hash) รหัสผ่าน โดยใช้เลขบัตรประชาชน (CitizenID)
	hashedPassword, err := utils.HashPassword(req.CitizenID)
	if err != nil {
		return nil, err
	}

	// 4. สร้างข้อมูลสำหรับตาราง Login ผูกกับระดับสิทธิ์ household
	login := entity.Login{
		SubdistrictID: village.SubdistrictID,
		Role:          entity.RoleHousehold,
		Status:        entity.StatusActive,
		Username:      usernameStr,
		PasswordHash:  hashedPassword,
	}

	// จัดการ Status ให้เป็นพิมพ์เล็กเพื่อเทียบกับ Enum
	var finalWaterStatus entity.UserStatus
	if strings.ToLower(req.WaterStatus) == "inactive" {
		finalWaterStatus = entity.UserStatus("inactive")
	} else {
		finalWaterStatus = entity.StatusActive
	}

	var finalGarbageStatus entity.UserStatus
	if strings.ToLower(req.GarbageStatus) == "inactive" {
		finalGarbageStatus = entity.UserStatus("inactive")
	} else {
		finalGarbageStatus = entity.StatusActive
	}

	// Validate GarbageSizeID
	if finalGarbageStatus == entity.StatusActive && req.GarbageSizeID == nil {
		return nil, errors.New("garbage_size_id is required when garbage_status is active")
	}

	// 5. สร้างข้อมูลสำหรับตาราง HouseHold โดยเชื่อมกับ Login ที่เพิ่งสร้าง
	household := entity.HouseHold{
		VillageID:     req.VillageID,
		HouseNumber:   req.HouseNumber,
		HouseCode:     req.HouseCode,
		TitleName:     entity.TitleName(req.TitleName),
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		CitizenID:     req.CitizenID,
		PhoneNumber:   req.PhoneNumber,
		WaterUserID:   req.WaterUserID,
		WaterStatus:   finalWaterStatus,
		GarbageStatus: finalGarbageStatus,
		Login:         &login,
	}

	// ถ้าบ้านนี้เลือกสถานะใช้น้ำ (Active) ถึงจะสร้างประวัติมิเตอร์เริ่มต้นให้
	if finalWaterStatus == entity.StatusActive {
		household.WaterReadings = []entity.WaterReading{
			{
				StaffID:      req.StaffID,
				PrevReading:  req.PrevReading,
				CurrReading:  req.PrevReading,
				UnitConsumed: 0,
				ReadingDate:  time.Now(),
				TotalAmount:  0,
			},
		}
	}

	// ถ้าบ้านนี้เลือกสถานะทิ้งขยะ (Active) ถึงจะสร้างประวัติทิ้งขยะเริ่มต้นให้
	if finalGarbageStatus == entity.StatusActive {
		household.GarbageReadings = []entity.GarbageReading{
			{
				StaffID:     req.StaffID,
				ReadingDate: time.Now(),
				TotalAmount: 0,
				GarbageReadingDetails: []entity.GarbageReadingDetail{
					{
						GarbageSizeID: *req.GarbageSizeID,
						Amount:        0, // ประวัติเริ่มต้นให้จำนวนเป็น 0
					},
				},
			},
		}
	}

	// 6. บันทึกข้อมูลลงฐานข้อมูล (GORM จะทำการบันทึก Login และ HouseHold ให้พร้อมกันผ่าน Association)
	err = s.repo.Create(&household)
	if err != nil {
		return nil, err
	}

	// 7. แปลงข้อมูล Entity เป็น Response DTO เพื่อส่งกลับให้ Frontend
	res := ToHouseholdResponse(&household, false, false)
	return &res, nil
}

// Update แก้ไขข้อมูลครัวเรือน
func (s *householdService) Update(id uint, req UpdateHouseholdRequest) (*HouseholdResponse, error) {
	// 1. ค้นหาครัวเรือนที่ต้องการแก้ไข
	household, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// 2. อัปเดตเฉพาะฟิลด์ที่มีการส่งค่าเข้ามา (Partial Update)
	if req.VillageID != 0 {
		household.VillageID = req.VillageID
	}
	if req.HouseNumber != "" {
		household.HouseNumber = req.HouseNumber
	}
	if req.HouseCode != "" {
		household.HouseCode = req.HouseCode
	}
	if req.TitleName != "" {
		household.TitleName = entity.TitleName(req.TitleName)
	}
	if req.FirstName != "" {
		household.FirstName = req.FirstName
	}
	if req.LastName != "" {
		household.LastName = req.LastName
	}
	if req.CitizenID != "" {
		household.CitizenID = req.CitizenID
	}
	if req.PhoneNumber != "" {
		household.PhoneNumber = req.PhoneNumber
	}
	if req.WaterUserID != "" {
		household.WaterUserID = req.WaterUserID
	}
	if req.Username != "" && household.Login != nil {
		household.Login.Username = req.Username
	}
	if req.Password != "" && household.Login != nil {
		hashedPassword, err := utils.HashPassword(req.Password)
		if err == nil {
			household.Login.PasswordHash = hashedPassword
		}
	}

	var finalWaterStatus entity.UserStatus
	if req.WaterStatus != "" {
		finalWaterStatus = entity.UserStatus(req.WaterStatus)
		household.WaterStatus = finalWaterStatus
	} else {
		finalWaterStatus = household.WaterStatus
	}

	var finalGarbageStatus entity.UserStatus
	if req.GarbageStatus != "" {
		finalGarbageStatus = entity.UserStatus(req.GarbageStatus)
		household.GarbageStatus = finalGarbageStatus
	} else {
		finalGarbageStatus = household.GarbageStatus
	}

	// อัปเดตประวัติการใช้น้ำหรือสร้างประวัติเริ่มต้น
	if finalWaterStatus == entity.StatusActive {
		if len(household.WaterReadings) > 0 {
			if req.PrevReading != nil {
				household.WaterReadings[0].PrevReading = *req.PrevReading
				if household.WaterReadings[0].UnitConsumed == 0 {
					household.WaterReadings[0].CurrReading = *req.PrevReading
				}
			}
		} else {
			prevVal := 0.0
			if req.PrevReading != nil {
				prevVal = *req.PrevReading
			}
			household.WaterReadings = []entity.WaterReading{
				{
					StaffID:      1,
					PrevReading:  prevVal,
					CurrReading:  prevVal,
					UnitConsumed: 0,
					ReadingDate:  time.Now(),
					TotalAmount:  0,
				},
			}
		}
	}

	// อัปเดตประวัติการทิ้งขยะหรือสร้างประวัติเริ่มต้น
	if finalGarbageStatus == entity.StatusActive {
		if len(household.GarbageReadings) > 0 {
			if req.GarbageSizeID != nil {
				if len(household.GarbageReadings[0].GarbageReadingDetails) > 0 {
					household.GarbageReadings[0].GarbageReadingDetails[0].GarbageSizeID = *req.GarbageSizeID
				} else {
					household.GarbageReadings[0].GarbageReadingDetails = []entity.GarbageReadingDetail{
						{
							GarbageSizeID: *req.GarbageSizeID,
							Amount:        0,
						},
					}
				}
			}
		} else if req.GarbageSizeID != nil {
			household.GarbageReadings = []entity.GarbageReading{
				{
					StaffID:     1,
					ReadingDate: time.Now(),
					TotalAmount: 0,
					GarbageReadingDetails: []entity.GarbageReadingDetail{
						{
							GarbageSizeID: *req.GarbageSizeID,
							Amount:        0,
						},
					},
				},
			}
		}
	}

	// 3. บันทึกการเปลี่ยนแปลงลงฐานข้อมูล
	err = s.repo.Update(household)
	if err != nil {
		return nil, err
	}

	// 4. เช็คสถานะการจดค่าน้ำ/ค่าขยะ และแปลงเป็น Response DTO
	isWater, isGarbage, _ := s.repo.CheckRecordedThisMonth(household.ID)
	res := ToHouseholdResponse(household, isWater, isGarbage)
	return &res, nil
}

// Delete ลบข้อมูลครัวเรือน
func (s *householdService) Delete(id uint) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("ไม่พบข้อมูลครัวเรือนที่ต้องการลบ")
	}
	return s.repo.Delete(id)
}

// Import รับรายการขอสร้างครัวเรือนจากไฟล์ ตรวจสอบความซ้ำซ้อน และบันทึกข้อมูล (All-or-Nothing)
func (s *householdService) Import(reqs []CreateHouseholdRequest) ImportHouseholdResponse {
	var response ImportHouseholdResponse
	response.TotalRows = len(reqs)

	// Fetch existing keys
	households, _ := s.repo.GetAll()
	dbHouseCodes := make(map[string]bool)
	dbCitizenIDs := make(map[string]bool)
	dbWaterUserIDs := make(map[string]bool)
	dbUsernames := make(map[string]bool)

	for _, h := range households {
		dbHouseCodes[h.HouseCode] = true
		dbCitizenIDs[h.CitizenID] = true
		if h.WaterUserID != "" {
			dbWaterUserIDs[h.WaterUserID] = true
		}
		if h.Login != nil {
			dbUsernames[h.Login.Username] = true
		}
	}

	villagesCache := make(map[uint]string) // villageID -> villageNumber string

	// Phase 2: ตรวจสอบความซ้ำซ้อนของข้อมูล (Duplicate Check)
	var newReqs []CreateHouseholdRequest

	for _, req := range reqs {
		var errs []string
		
		// ตรวจสอบว่าเป็นข้อมูลที่ซ้ำกับในระบบทั้งหมดเลยหรือไม่
		isCompleteDuplicate := false
		if dbHouseCodes[req.HouseCode] && dbCitizenIDs[req.CitizenID] {
			if req.WaterUserID == "" || dbWaterUserIDs[req.WaterUserID] {
				isCompleteDuplicate = true
			}
		}

		if isCompleteDuplicate {
			// ข้ามข้อมูลนี้ไปเงียบๆ (Skipped)
			response.SkippedCount++
			response.Results = append(response.Results, ImportHouseholdResult{
				RowNumber: req.RowNumber,
				Success:   false,
				Skipped:   true,
				Error:     "ข้ามข้อมูล (ข้อมูลครัวเรือนนี้มีอยู่ในระบบแล้ว)",
			})
			continue // ไม่เช็ค error ต่อ และไม่เอาเข้า newReqs
		} else {
			if dbHouseCodes[req.HouseCode] {
				errs = append(errs, "รหัสครัวเรือน (HouseCode) นี้มีซ้ำอยู่ในระบบแล้ว")
			}
			if dbCitizenIDs[req.CitizenID] {
				errs = append(errs, "รหัสบัตรประชาชน (CitizenID) นี้มีซ้ำอยู่ในระบบแล้ว")
			}
			if req.WaterUserID != "" && dbWaterUserIDs[req.WaterUserID] {
				errs = append(errs, "รหัสผู้ใช้น้ำ (WaterUserID) นี้มีซ้ำอยู่ในระบบแล้ว")
			}
			
			// เช็คหมู่บ้านและบ้านเลขที่ เพื่อดูว่า Username จะซ้ำไหม
			villageNumber, ok := villagesCache[req.VillageID]
			if !ok {
				village, err := s.repo.GetVillageByID(req.VillageID)
				if err != nil {
					errs = append(errs, "ไม่พบข้อมูลหมู่บ้าน (VillageID) ที่ระบุในระบบ")
				} else {
					villageNumber = fmt.Sprintf("%d", village.VillageNumber)
					villagesCache[req.VillageID] = villageNumber
				}
			}
			if villageNumber != "" {
				usernameStr := fmt.Sprintf("%s-%s", req.HouseNumber, villageNumber)
				if dbUsernames[usernameStr] {
					errs = append(errs, "บ้านเลขที่และหมู่ที่นี้ มีการลงทะเบียนในระบบแล้ว")
				}
				dbUsernames[usernameStr] = true // อัปเดตเพื่อเช็คการซ้ำในไฟล์เดียวกันเองด้วย
			}
		}

		// อัปเดตตัวแปรเพื่อเช็คการซ้ำซ้อนภายในไฟล์เดียวกันเอง (เฉพาะอันที่ไม่ถูก skip)
		dbHouseCodes[req.HouseCode] = true
		dbCitizenIDs[req.CitizenID] = true
		if req.WaterUserID != "" {
			dbWaterUserIDs[req.WaterUserID] = true
		}

		if len(errs) > 0 {
			response.FailedCount++
			response.Results = append(response.Results, ImportHouseholdResult{
				RowNumber: req.RowNumber,
				Success:   false,
				Error:     strings.Join(errs, ", "),
			})
		} else {
			newReqs = append(newReqs, req)
		}
	}

	// เช็คเงื่อนไข All-or-Nothing
	if response.FailedCount > 0 {
		// ถ้ามี Error แม้แต่แถวเดียว จะไม่นำเข้าข้อมูลใหม่ทั้งหมดเลย
		return response
	}

	if len(newReqs) == 0 && response.SkippedCount > 0 {
		// ถ้าไม่มีข้อมูลใหม่เลย และทุกอย่างถูก Skip หมด แปลว่าอัปไฟล์เดิม
		response.FailedCount = 1 // ถือว่าเป็น Error ระดับไฟล์
		response.Results = append([]ImportHouseholdResult{{
			RowNumber: 0, // 0 หมายถึงภาพรวมของไฟล์
			Success:   false,
			Error:     "ข้อมูลทั้งหมดในไฟล์นี้มีอยู่ในระบบแล้ว (ไม่มีข้อมูลใหม่ที่จะนำเข้า)",
		}}, response.Results...)
		return response
	}

	// Phase 3: ถ้าข้อมูลใหม่ถูกต้องทั้งหมด ทำการบันทึกข้อมูล
	for _, req := range newReqs {
		createdHousehold, err := s.Create(req)
		
		if err != nil {
			response.FailedCount++
			response.Results = append(response.Results, ImportHouseholdResult{
				RowNumber: req.RowNumber,
				Success:   false,
				Error:     "เกิดข้อผิดพลาดในการบันทึกฐานข้อมูล: " + err.Error(),
			})
		} else {
			response.SuccessCount++
			response.Results = append(response.Results, ImportHouseholdResult{
				RowNumber: req.RowNumber,
				Success:   true,
				Data:      createdHousehold,
			})
		}
	}

	return response
}

