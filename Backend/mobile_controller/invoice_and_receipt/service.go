package invoice_and_receipt

import (
	"backend/entity"
	"errors"
	"fmt"
	"strings"
	"time"
)

type InvoiceReceiptService interface {
	GetInvoice(householdID uint, subdistrictID uint, month int, year int) (*MobileInvoiceReceiptResponse, error)
	GetReceipt(householdID uint, subdistrictID uint, month int, year int) (*MobileInvoiceReceiptResponse, error)
}

type invoiceReceiptService struct {
	repo InvoiceReceiptRepository
}

func NewInvoiceReceiptService(r InvoiceReceiptRepository) InvoiceReceiptService {
	return &invoiceReceiptService{repo: r}
}

func (s *invoiceReceiptService) GetInvoice(householdID uint, subdistrictID uint, month int, year int) (*MobileInvoiceReceiptResponse, error) {
	startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	inv, err := s.repo.GetInvoiceByHouseholdAndDate(householdID, subdistrictID, startOfMonth, endOfMonth)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลใบแจ้งหนี้ของครัวเรือนนี้สำหรับรอบเดือนที่ระบุ")
	}

	if inv.Status == entity.InvoicePaid {
		return nil, errors.New("ใบแจ้งหนี้ได้รับการชำระเงินเรียบร้อยแล้ว กรุณาเข้าผ่านหน้าใบเสร็จรับเงิน")
	}

	return s.mapInvoiceToResponse(inv), nil
}

func (s *invoiceReceiptService) GetReceipt(householdID uint, subdistrictID uint, month int, year int) (*MobileInvoiceReceiptResponse, error) {
	startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	inv, err := s.repo.GetInvoiceByHouseholdAndDate(householdID, subdistrictID, startOfMonth, endOfMonth)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลใบเสร็จรับเงินของครัวเรือนนี้สำหรับรอบเดือนที่ระบุ")
	}

	if inv.Status != entity.InvoicePaid {
		return nil, errors.New("ใบแจ้งหนี้ยังไม่ได้ชำระเงิน กรุณาเข้าผ่านหน้าใบแจ้งชำระเงิน")
	}

	return s.mapInvoiceToResponse(inv), nil
}

func (s *invoiceReceiptService) mapInvoiceToResponse(inv *entity.Invoice) *MobileInvoiceReceiptResponse {
	calculatedStatus := "unpaid"
	if inv.Status == entity.InvoicePaid {
		calculatedStatus = "paid"
	}

	villageName := ""
	villageNumber := 0
	subdistrictName := ""
	districtName := ""
	provinceName := ""
	var houseNumber, ownerName, waterUserID string
	var villageID uint

	if inv.HouseHold != nil {
		h := inv.HouseHold
		villageID = h.VillageID
		houseNumber = h.HouseNumber
		ownerName = fmt.Sprintf("%s%s %s", h.TitleName, h.FirstName, h.LastName)
		waterUserID = h.WaterUserID

		if h.Village != nil {
			v := h.Village
			villageName = v.VillageName
			villageNumber = v.VillageNumber
			if v.Subdistrict != nil {
				subdistrictName = v.Subdistrict.SubdistrictName
				if v.Subdistrict.District != nil {
					districtName = v.Subdistrict.District.DistrictName
					if v.Subdistrict.District.Province != nil {
						provinceName = v.Subdistrict.District.Province.ProvinceName
					}
				}
			}
		}
	}

	var previousMeter float64
	var currentMeter *float64
	if inv.WaterReading != nil {
		previousMeter = inv.WaterReading.PrevReading
		currVal := inv.WaterReading.CurrReading
		currentMeter = &currVal
	}

	var waterBillAmount float64
	if inv.WaterReading != nil {
		waterBillAmount = inv.WaterReading.TotalAmount
	}

	var garbageBillAmount float64
	if inv.GarbageReading != nil {
		garbageBillAmount = inv.GarbageReading.TotalAmount
	}

	var payMethod *string
	var payTime *time.Time
	var receiptNumber string
	var qrCodeURL string
	for _, tx := range inv.PaymentTransactions {
		if tx.PaymentStatus == entity.PaymentSuccess {
			m := string(tx.PaymentMethod)
			if m == string(entity.MethodCash) {
				m = "cash"
			} else if m == string(entity.MethodQRPromptpay) {
				m = "promptpay"
			}
			payMethod = &m
			if tx.PaidAt != nil {
				payTime = tx.PaidAt
			}
			receiptNumber = tx.ReceiptNumber
			qrCodeURL = tx.QRCodeURL
			break
		}
	}

	// fallback to first transaction if no successful one found (e.g. pending/failed)
	if payMethod == nil && len(inv.PaymentTransactions) > 0 {
		tx := inv.PaymentTransactions[0]
		m := string(tx.PaymentMethod)
		if m == string(entity.MethodCash) {
			m = "cash"
		} else if m == string(entity.MethodQRPromptpay) {
			m = "promptpay"
		}
		payMethod = &m
		payTime = tx.PaidAt
		receiptNumber = tx.ReceiptNumber
		qrCodeURL = tx.QRCodeURL
	}

	// 1. Bill Month in Thai
	thaiMonths := []string{
		"", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
		"กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
	}
	issueMonth := int(inv.IssueDate.Month())
	issueYear := inv.IssueDate.Year() + 543
	billMonth := fmt.Sprintf("%s %d", thaiMonths[issueMonth], issueYear)

	// 2. Organization Address
	orgName := ""
	orgAddress := ""
	orgPhone := ""
	if inv.HouseHold != nil && inv.HouseHold.Village != nil && inv.HouseHold.Village.Subdistrict != nil {
		sd := inv.HouseHold.Village.Subdistrict
		orgName = "องค์การบริหารส่วนตำบล" + sd.SubdistrictName
		orgAddress = fmt.Sprintf("ที่ทำการองค์การบริหารส่วนตำบล%s เลขที่ %s ต.%s อ.%s จ.%s",
			sd.SubdistrictName, sd.AddressNumber, sd.SubdistrictName, districtName, provinceName)
		if sd.SubdistrictInfo != nil {
			orgPhone = sd.SubdistrictInfo.PhoneNumber
		}
	}

	// 3. Household details
	fullAddress := fmt.Sprintf("บ้านเลขที่ %s หมู่ที่ %d %s ต.%s อ.%s จ.%s",
		houseNumber, villageNumber, villageName, subdistrictName, districtName, provinceName)

	// 4. Water Reading Usage Start / End Dates
	var startDate *time.Time
	var endDate *time.Time
	if inv.WaterReading != nil {
		eDate := inv.WaterReading.ReadingDate
		endDate = &eDate
		prevReading, err := s.repo.GetPreviousWaterReading(inv.HouseHoldID, eDate)
		if err == nil && prevReading != nil {
			sDate := prevReading.ReadingDate
			startDate = &sDate
		} else {
			sDate := eDate.AddDate(0, -1, 0)
			startDate = &sDate
		}
	}

	// 5. Garbage details
	garbageDetails := make([]GarbageDetailSchema, 0)
	if inv.GarbageReading != nil {
		for _, detail := range inv.GarbageReading.GarbageReadingDetails {
			if detail.Amount > 0 && detail.GarbageSize != nil {
				garbageDetails = append(garbageDetails, GarbageDetailSchema{
					SizeName: detail.GarbageSize.SizeName,
					Cost:     detail.GarbageSize.Cost,
					Amount:   detail.Amount,
				})
			}
		}
	}

	// 6. Staff Name
	staffName := ""
	for _, tx := range inv.PaymentTransactions {
		if tx.PaymentStatus == entity.PaymentSuccess && tx.Staff != nil {
			staffName = fmt.Sprintf("%s%s %s", tx.Staff.TitleName, tx.Staff.FirstName, tx.Staff.LastName)
			break
		}
	}

	res := &MobileInvoiceReceiptResponse{
		ID:            inv.HouseHoldID,
		InvoiceID:     inv.ID,
		VillageID:     villageID,
		Status:        calculatedStatus,
		ReceiptNumber: receiptNumber,
		QRCodeURL:     qrCodeURL,
		TotalAmount:   inv.TotalAmount,
		BillMonth:     billMonth,
		PaymentMethod: payMethod,
	}

	if payTime != nil {
		res.ReceiptDate = payTime
		res.PaidAt = payTime
	}

	res.Organization.Name = orgName
	res.Organization.Address = orgAddress
	res.Organization.PhoneNumber = orgPhone

	res.Household.WaterUserID = waterUserID
	res.Household.OwnerName = ownerName
	res.Household.HouseNumber = houseNumber
	res.Household.VillageName = villageName
	res.Household.VillageNumber = villageNumber
	res.Household.FullAddress = fullAddress

	if inv.WaterReading != nil {
		res.WaterUsage.PrevReadingValue = previousMeter
		res.WaterUsage.CurrReadingValue = *currentMeter
		res.WaterUsage.UnitConsumed = inv.WaterReading.UnitConsumed
		res.WaterUsage.WaterBillAmount = waterBillAmount
		res.WaterUsage.StartDate = startDate
		res.WaterUsage.EndDate = endDate
	}

	res.GarbageUsage.TotalAmount = garbageBillAmount
	res.GarbageUsage.Details = garbageDetails
	res.StaffName = staffName

	return res
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
