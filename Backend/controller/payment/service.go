package payment

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"os"
	"strings"
	"time"

	"backend/entity"

	"github.com/omise/omise-go"
	"github.com/omise/omise-go/operations"
)

type PaymentService interface {
	CreatePromptPayCharge(req CreatePromptPayRequest) (*PromptPayResponse, error)
	GetPaymentStatus(invoiceID uint) (*PaymentStatusResponse, error)
	ProcessWebhook(signatureHeader, timestampHeader string, rawBody []byte) error
	GetPaymentsByHouseholdID(householdID uint) ([]PaymentResponse, error)
	CreateCashPayment(userID uint, req CreateCashPaymentRequest) (*CashPaymentResponse, error)
	GetReceiptByInvoiceID(invoiceID uint) (*ReceiptResponse, error)
}

type paymentService struct {
	repo   PaymentRepository
	client *omise.Client
}

func NewPaymentService(repo PaymentRepository) PaymentService {
	publicKey := os.Getenv("OMISE_PUBLIC_KEY")
	secretKey := os.Getenv("OMISE_SECRET_KEY")
	client, err := omise.NewClient(publicKey, secretKey)
	if err != nil {
		// client initialization failed but we can still return service struct
		// client will be nil and client calls will error
	}
	return &paymentService{
		repo:   repo,
		client: client,
	}
}

func (s *paymentService) CreatePromptPayCharge(req CreatePromptPayRequest) (*PromptPayResponse, error) {
	if s.client == nil {
		return nil, errors.New("ระบบชำระเงินยังไม่ได้กำหนดค่าคีย์ความปลอดภัยอย่างถูกต้อง")
	}

	// 1. ดึงข้อมูลใบแจ้งหนี้
	invoice, err := s.repo.GetInvoiceByID(req.InvoiceID)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลใบแจ้งหนี้ที่ระบุ")
	}

	// 2. ตรวจสอบสถานะการชำระเงิน
	if invoice.Status == entity.InvoicePaid {
		return nil, errors.New("ใบแจ้งหนี้นี้ได้รับการชำระเงินเรียบร้อยแล้ว")
	}

	// 2.5 ป้องกันการสร้างธุรกรรมพร้อมเพย์ซ้ำซ้อน: ค้นหารายการธุรกรรม Pending เดิมที่ยังมี QR Code อยู่
	txs, err := s.repo.GetTransactionsByInvoiceID(req.InvoiceID)
	if err == nil && len(txs) > 0 {
		latestTx := txs[0] // รายการล่าสุดจะอยู่หน้าสุด (เรียงลำดับ desc ใน repository)
		if latestTx.PaymentStatus == entity.PaymentPending &&
			latestTx.PaymentMethod == entity.MethodQRPromptpay &&
			latestTx.QRCodeURL != "" {
			
			return &PromptPayResponse{
				TransactionID: latestTx.OmiseTransactionID,
				InvoiceID:     latestTx.InvoiceID,
				Amount:        invoice.TotalAmount,
				Currency:      latestTx.Currency,
				QRCodeURL:     latestTx.QRCodeURL,
				Status:        string(latestTx.PaymentStatus),
			}, nil
		}
	}

	// 3. คำนวณยอดเงินเป็นหน่วยสตางค์ (คูณ 100)
	amountInSatang := int64(math.Round(invoice.TotalAmount * 100))
	if amountInSatang < 2000 {
		return nil, errors.New("ยอดเงินขั้นต่ำสำหรับการจ่ายผ่านพร้อมเพย์คือ 20.00 บาท")
	}
	if amountInSatang > 15000000 {
		return nil, errors.New("ยอดเงินชำระสูงสุดไม่เกิน 150,000.00 บาท")
	}

	// 4. สร้าง Source (type: promptpay) ในระบบของ Omise
	source := &omise.Source{}
	err = s.client.Do(source, &operations.CreateSource{
		Type:     "promptpay",
		Amount:   amountInSatang,
		Currency: "THB",
	})
	if err != nil {
		return nil, errors.New("ล้มเหลวในการสร้างช่องทางชำระเงิน (Omise Source Error): " + err.Error())
	}

	// 5. สร้าง Charge ในระบบของ Omise
	charge := &omise.Charge{}
	err = s.client.Do(charge, &operations.CreateCharge{
		Amount:   amountInSatang,
		Currency: "THB",
		Source:   source.ID,
		Metadata: map[string]interface{}{
			"invoice_id": invoice.ID,
		},
	})
	if err != nil {
		return nil, errors.New("ล้มเหลวในการสร้างคำขอเรียกเก็บเงิน (Omise Charge Error): " + err.Error())
	}

	// 6. ดึง QR Code URL จาก Source ScannableCode
	qrCodeURL := ""
	if charge.Source != nil &&
		charge.Source.ScannableCode != nil &&
		charge.Source.ScannableCode.Image != nil {
		qrCodeURL = charge.Source.ScannableCode.Image.DownloadURI
	}

	if qrCodeURL == "" {
		return nil, errors.New("ไม่สามารถรับรูปคิวอาร์โค้ดพร้อมเพย์ได้จากเซิร์ฟเวอร์ผู้ให้บริการ")
	}

	// 7. บันทึกข้อมูลผลลัพธ์กลับแบบ JSON เพื่อทำสถิติ/ตรวจสอบภายหลัง
	rawResponse, _ := json.Marshal(charge)

	// 8. สร้างประวัติธุรกรรมใหม่ (PaymentTransaction)
	tx := &entity.PaymentTransaction{
		InvoiceID:          invoice.ID,
		OmiseTransactionID: charge.ID,
		PaymentMethod:      entity.MethodQRPromptpay,
		PaymentStatus:      entity.PaymentPending,
		QRCodeURL:          qrCodeURL,
		ExternalRef:        "",
		RawGatewayResponse: string(rawResponse),
		Currency:           "THB",
	}

	err = s.repo.CreateTransaction(tx)
	if err != nil {
		return nil, errors.New("ไม่สามารถบันทึกประวัติการสร้างธุรกรรมลงในระบบฐานข้อมูลได้")
	}

	return &PromptPayResponse{
		TransactionID: charge.ID,
		InvoiceID:     invoice.ID,
		Amount:        invoice.TotalAmount,
		Currency:      "THB",
		QRCodeURL:     qrCodeURL,
		Status:        string(charge.Status),
	}, nil
}

func (s *paymentService) GetPaymentStatus(invoiceID uint) (*PaymentStatusResponse, error) {
	// ดึงข้อมูลใบแจ้งหนี้เพื่อเช็คสถานะภาพรวม
	invoice, err := s.repo.GetInvoiceByID(invoiceID)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลใบแจ้งหนี้")
	}

	// ดึงธุรกรรมล่าสุดของใบแจ้งหนี้ใบนี้
	txs, err := s.repo.GetTransactionsByInvoiceID(invoiceID)
	if err != nil || len(txs) == 0 {
		// หากยังไม่มีธุรกรรม แต่ใบแจ้งหนี้เป็น pending
		return &PaymentStatusResponse{
			InvoiceID: invoiceID,
			Status:    string(invoice.Status),
		}, nil
	}

	latestTx := txs[0]
	return &PaymentStatusResponse{
		InvoiceID:     invoiceID,
		TransactionID: latestTx.OmiseTransactionID,
		Status:        string(latestTx.PaymentStatus),
		Method:        string(latestTx.PaymentMethod),
		PaidAt:        latestTx.PaidAt,
	}, nil
}

func (s *paymentService) ProcessWebhook(signatureHeader, timestampHeader string, rawBody []byte) error {
	webhookSecret := os.Getenv("OMISE_WEBHOOK_SECRET")
	if webhookSecret == "" {
		log.Println("[Webhook Error] webhook secret is not configured in .env")
		return errors.New("webhook secret is not configured in .env")
	}

	// 1. ถอดรหัส Base64 ของ Webhook Secret
	decodedSecret, err := base64.StdEncoding.DecodeString(webhookSecret)
	if err != nil {
		log.Printf("[Webhook Error] failed to decode webhook secret base64: %v", err)
		return errors.New("failed to decode webhook secret base64")
	}

	// 2. คำนวณลายเซ็นคาดหวัง (HMAC-SHA256)
	mac := hmac.New(sha256.New, decodedSecret)
	mac.Write([]byte(timestampHeader + "." + string(rawBody)))
	expectedMAC := mac.Sum(nil)
	expectedHex := hex.EncodeToString(expectedMAC)

	// 3. เปรียบเทียบลายเซ็นทั้งหมด
	signatures := strings.Split(signatureHeader, ",")
	verified := false
	for _, sig := range signatures {
		sig = strings.TrimSpace(sig)
		if subtle.ConstantTimeCompare([]byte(sig), []byte(expectedHex)) == 1 {
			verified = true
			break
		}
	}

	if !verified {
		log.Printf("[Webhook Error] signature verification failed. Expected: %s, Received: %s", expectedHex, signatureHeader)
		return errors.New("webhook signature verification failed")
	}

	// 4. แกะ JSON Payload เป็นโครงสร้างแบบ Event
	type WebhookPayload struct {
		Key  string        `json:"key"`
		Data *omise.Charge `json:"data"`
	}

	var payload WebhookPayload
	if err := json.Unmarshal(rawBody, &payload); err != nil {
		log.Printf("[Webhook Error] failed to unmarshal body: %v", err)
		return err
	}

	// 5. จัดการเมื่อเกิดเหตุการณ์ charge.complete
	if payload.Key == "charge.complete" && payload.Data != nil {
		charge := payload.Data

		// ดึงข้อมูลธุรกรรมเดิมในระบบ
		tx, err := s.repo.GetTransactionByOmiseID(charge.ID)
		if err != nil {
			log.Printf("[Webhook Error] payment transaction not found for charge ID: %s", charge.ID)
			return errors.New("payment transaction not found for charge: " + charge.ID)
		}

		// อัปเดต raw gateway response ตัวใหม่
		rawResponse, _ := json.Marshal(charge)
		tx.RawGatewayResponse = string(rawResponse)

		if charge.Status == omise.ChargeSuccessful {
			tx.PaymentStatus = entity.PaymentSuccess

			paidTime := time.Now()
			if !charge.CreatedAt.IsZero() {
				paidTime = charge.CreatedAt
			}
			tx.PaidAt = &paidTime

			// เช็คข้อมูลใบแจ้งหนี้ก่อนเพื่อป้องกันการจ่ายซ้ำ
			invoice, err := s.repo.GetInvoiceByID(tx.InvoiceID)
			if err != nil {
				log.Printf("[Webhook Error] invoice not found: %d", tx.InvoiceID)
				return err
			}

			if invoice.Status == entity.InvoicePaid {
				log.Printf("[DOUBLE PAYMENT ALERT] Invoice %d was already paid! PromptPay charge %s also succeeded. Manual refund is required.", tx.InvoiceID, charge.ID)
				
				// อัปเดตเฉพาะรายการธุรกรรมใน DB เป็น success แต่ห้ามแตะต้อง Invoice
				err = s.repo.UpdateTransaction(tx)
				if err != nil {
					log.Printf("[Webhook Error] failed to update duplicate transaction: %v", err)
					return err
				}
				return nil
			}

			// ทำการอัปเดตสถานะธุรกรรมและใบแจ้งหนี้ให้จ่ายแล้วผ่าน Transaction (กรณีปกติ)
			err = s.repo.CompletePayment(tx, entity.InvoicePaid)
			if err != nil {
				log.Printf("[Webhook Error] failed to complete payment transaction: %v", err)
				return err
			}
			log.Printf("[Webhook Success] Invoice %d marked as paid via charge %s", tx.InvoiceID, charge.ID)
			
			// Publish success event to SSE broker
			GlobalBroker.Publish(tx.InvoiceID, "success")
		} else if charge.Status == omise.ChargeFailed {
			tx.PaymentStatus = entity.PaymentFailed
			err = s.repo.UpdateTransaction(tx)
			if err != nil {
				log.Printf("[Webhook Error] failed to update transaction to failed: %v", err)
				return err
			}
			log.Printf("[Webhook Failed] Charge %s failed", charge.ID)

			// Publish failed event to SSE broker
			GlobalBroker.Publish(tx.InvoiceID, "failed")
		}
	}

	return nil
}

func (s *paymentService) GetPaymentsByHouseholdID(householdID uint) ([]PaymentResponse, error) {
	// ดึงข้อมูลดิบจากฐานข้อมูล
	payments, err := s.repo.FindByHouseholdID(householdID)
	if err != nil {
		return nil, err
	}

	// แปลงข้อมูลที่ได้ เป็น JSON Response ที่หน้าบ้านต้องการ
	return ToPaymentResponses(payments), nil
}

func (s *paymentService) CreateCashPayment(userID uint, req CreateCashPaymentRequest) (*CashPaymentResponse, error) {
	// 1. ดึงข้อมูลพนักงานจาก userID
	staff, err := s.repo.GetStaffByUserID(userID)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลพนักงานที่ทำการรับชำระเงิน")
	}

	// 2. ดึงข้อมูลใบแจ้งหนี้
	invoice, err := s.repo.GetInvoiceByID(req.InvoiceID)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลใบแจ้งหนี้ที่ระบุ")
	}

	// 3. ตรวจสอบสถานะการชำระเงิน
	if invoice.Status == entity.InvoicePaid {
		return nil, errors.New("ใบแจ้งหนี้นี้ได้รับการชำระเงินเรียบร้อยแล้ว")
	}

	// 4. บันทึกข้อมูลธุรกรรมใหม่ (PaymentTransaction) สำหรับเงินสด
	paidAt := time.Now()
	tx := &entity.PaymentTransaction{
		InvoiceID:          invoice.ID,
		OmiseTransactionID: "", // ไม่มีธุรกรรมของ Omise เนื่องจากจ่ายเป็นเงินสด
		PaymentMethod:      entity.MethodCash,
		PaymentStatus:      entity.PaymentSuccess,
		StaffID:            &staff.ID,
		ExternalRef:        "",
		RawGatewayResponse: "cash payment recorded by staff",
		Currency:           "THB",
		PaidAt:             &paidAt,
	}

	// 5. บันทึกและอัปเดตสถานะใบแจ้งหนี้ผ่าน CompletePayment (DB Transaction)
	err = s.repo.CompletePayment(tx, entity.InvoicePaid)
	if err != nil {
		return nil, errors.New("ไม่สามารถบันทึกประวัติการชำระเงินสดลงในฐานข้อมูลได้")
	}

	return &CashPaymentResponse{
		InvoiceID: invoice.ID,
		Amount:    invoice.TotalAmount,
		Currency:  "THB",
		Status:    string(tx.PaymentStatus),
		PaidAt:    tx.PaidAt,
		StaffID:   staff.ID,
	}, nil
}

func (s *paymentService) GetReceiptByInvoiceID(invoiceID uint) (*ReceiptResponse, error) {
	// 1. ดึงข้อมูลธุรกรรมที่สำเร็จสำหรับบิลนี้
	tx, err := s.repo.GetSuccessTransactionByInvoiceID(invoiceID)
	if err != nil {
		return nil, errors.New("ไม่พบข้อมูลธุรกรรมการชำระเงินที่สำเร็จสำหรับใบแจ้งหนี้นี้")
	}

	if tx.Invoice == nil {
		return nil, errors.New("ไม่พบข้อมูลใบแจ้งหนี้ที่ผูกกับธุรกรรมนี้")
	}

	// 2. หาวันที่ใช้น้ำเริ่มต้น (StartDate) และวันสิ้นสุด (EndDate)
	var startDate time.Time
	var endDate time.Time

	if tx.Invoice.WaterReading != nil {
		endDate = tx.Invoice.WaterReading.ReadingDate
		prevReading, err := s.repo.GetPreviousWaterReading(tx.Invoice.HouseHoldID, endDate)
		if err != nil {
			return nil, err
		}
		if prevReading != nil {
			startDate = prevReading.ReadingDate
		} else {
			// รอบแรกของบ้าน ให้ลบถอยหลังไป 30 วัน
			startDate = endDate.AddDate(0, -1, 0)
		}
	} else {
		// ถ้าไม่มีข้อมูลการจดค่าน้ำ
		endDate = tx.Invoice.IssueDate
		startDate = endDate.AddDate(0, -1, 0)
	}

	// 3. จัดการโครงสร้างข้อมูลส่งกลับ
	res := &ReceiptResponse{}
	
	// ตั้งรูปแบบ Receipt Number จากฐานข้อมูล (พร้อม fallback สำหรับรายการธุรกรรมเก่าที่ยังไม่มีค่านี้)
	if tx.ReceiptNumber != "" {
		res.ReceiptNumber = tx.ReceiptNumber
	} else {
		issueStr := tx.PaidAt.Format("20060102")
		res.ReceiptNumber = "REC-" + issueStr + "-" + fmt.Sprintf("%06d", tx.InvoiceID)
	}
	res.ReceiptDate = tx.PaidAt
	res.PaidAt = tx.PaidAt
	res.PaymentMethod = tx.PaymentMethod
	res.TotalAmount = tx.Invoice.TotalAmount

	// แปลงวันที่ออกบิลเป็นประจำเดือนภาษาไทย พ.ศ.
	thaiMonths := []string{
		"", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
		"กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
	}
	issueMonth := int(tx.Invoice.IssueDate.Month())
	issueYear := tx.Invoice.IssueDate.Year() + 543
	res.BillMonth = fmt.Sprintf("%s %d", thaiMonths[issueMonth], issueYear)

	// บรรจุข้อมูลครัวเรือนและดึงข้อมูลมาประกอบที่อยู่เต็ม รวมถึงชื่อ อบต.
	if tx.Invoice.HouseHold != nil {
		h := tx.Invoice.HouseHold
		res.Household.WaterUserID = h.WaterUserID
		res.Household.OwnerName = string(h.TitleName) + h.FirstName + " " + h.LastName
		res.Household.HouseNumber = h.HouseNumber

		if h.Village != nil {
			res.Household.VillageName = h.Village.VillageName
			res.Household.VillageNumber = h.Village.VillageNumber

			subdistrictName := ""
			districtName := ""
			provinceName := ""

			if h.Village.Subdistrict != nil {
				subdistrictName = h.Village.Subdistrict.SubdistrictName
				if h.Village.Subdistrict.District != nil {
					districtName = h.Village.Subdistrict.District.DistrictName
					if h.Village.Subdistrict.District.Province != nil {
						provinceName = h.Village.Subdistrict.District.Province.ProvinceName
					}
				}
			}

			// ประกอบที่อยู่เต็มของผู้ใช้น้ำ
			res.Household.FullAddress = fmt.Sprintf("บ้านเลขที่ %s หมู่ที่ %d %s ต.%s อ.%s จ.%s",
				h.HouseNumber, h.Village.VillageNumber, h.Village.VillageName, subdistrictName, districtName, provinceName)

			// ดึงข้อมูล อบต. และที่ตั้งมาใส่ Organization
			if h.Village.Subdistrict != nil {
				sd := h.Village.Subdistrict
				res.Organization.Name = "องค์การบริหารส่วนตำบล" + sd.SubdistrictName

				// ที่อยู่ อบต.
				res.Organization.Address = fmt.Sprintf("ที่ทำการองค์การบริหารส่วนตำบล%s เลขที่ %s ต.%s อ.%s จ.%s",
					sd.SubdistrictName, sd.AddressNumber, sd.SubdistrictName, districtName, provinceName)

				// เบอร์ติดต่อ
				if sd.SubdistrictInfo != nil {
					res.Organization.PhoneNumber = sd.SubdistrictInfo.PhoneNumber
				}
			}
		}
	}

	// บรรจุข้อมูลค่าน้ำประปา
	if tx.Invoice.WaterReading != nil {
		res.WaterUsage.PrevReadingValue = tx.Invoice.WaterReading.PrevReading
		res.WaterUsage.CurrReadingValue = tx.Invoice.WaterReading.CurrReading
		res.WaterUsage.UnitConsumed = tx.Invoice.WaterReading.UnitConsumed
		res.WaterUsage.WaterBillAmount = tx.Invoice.WaterReading.TotalAmount
		res.WaterUsage.StartDate = &startDate
		res.WaterUsage.EndDate = &endDate
	}

	// บรรจุข้อมูลค่าขยะ
	if tx.Invoice.GarbageReading != nil {
		res.GarbageUsage.TotalAmount = tx.Invoice.GarbageReading.TotalAmount
		res.GarbageUsage.Details = make([]GarbageDetailSchema, 0)

		for _, detail := range tx.Invoice.GarbageReading.GarbageReadingDetails {
			if detail.Amount > 0 && detail.GarbageSize != nil {
				res.GarbageUsage.Details = append(res.GarbageUsage.Details, GarbageDetailSchema{
					SizeName: detail.GarbageSize.SizeName,
					Cost:     detail.GarbageSize.Cost,
					Amount:   detail.Amount,
				})
			}
		}
	}

	// บรรจุข้อมูลชื่อพนักงานที่รับเงิน
	if tx.Staff != nil {
		res.StaffName = string(tx.Staff.TitleName) + tx.Staff.FirstName + " " + tx.Staff.LastName
	}

	return res, nil
}
