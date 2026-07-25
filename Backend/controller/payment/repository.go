package payment

import (
	"fmt"
	"time"

	"backend/entity"
	"gorm.io/gorm"
)

type PaymentRepository interface {
	GetInvoiceByID(invoiceID uint) (*entity.Invoice, error)
	CreateTransaction(tx *entity.PaymentTransaction) error
	GetTransactionByOmiseID(omiseID string) (*entity.PaymentTransaction, error)
	GetTransactionsByInvoiceID(invoiceID uint) ([]entity.PaymentTransaction, error)
	UpdateTransaction(tx *entity.PaymentTransaction) error
	UpdateInvoiceStatus(invoiceID uint, status entity.InvoiceStatus) error
	CompletePayment(tx *entity.PaymentTransaction, invoiceStatus entity.InvoiceStatus) error
	FindByHouseholdID(householdID uint) ([]entity.PaymentTransaction, error)
	GetStaffByUserID(userID uint) (*entity.Staff, error)
	GetSuccessTransactionByInvoiceID(invoiceID uint) (*entity.PaymentTransaction, error)
	GetPreviousWaterReading(householdID uint, currentReadingDate time.Time) (*entity.WaterReading, error)
}

type paymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) PaymentRepository {
	return &paymentRepository{db: db}
}

func (r *paymentRepository) GetInvoiceByID(invoiceID uint) (*entity.Invoice, error) {
	var invoice entity.Invoice
	err := r.db.First(&invoice, invoiceID).Error
	if err != nil {
		return nil, err
	}
	return &invoice, nil
}

func (r *paymentRepository) CreateTransaction(tx *entity.PaymentTransaction) error {
	return r.db.Create(tx).Error
}

func (r *paymentRepository) GetTransactionByOmiseID(omiseID string) (*entity.PaymentTransaction, error) {
	var tx entity.PaymentTransaction
	err := r.db.Where("omise_transaction_id = ?", omiseID).First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *paymentRepository) GetTransactionsByInvoiceID(invoiceID uint) ([]entity.PaymentTransaction, error) {
	var txs []entity.PaymentTransaction
	err := r.db.Where("invoice_id = ?", invoiceID).Order("created_at desc").Find(&txs).Error
	if err != nil {
		return nil, err
	}
	return txs, nil
}

func (r *paymentRepository) UpdateTransaction(tx *entity.PaymentTransaction) error {
	return r.db.Save(tx).Error
}

func (r *paymentRepository) UpdateInvoiceStatus(invoiceID uint, status entity.InvoiceStatus) error {
	return r.db.Model(&entity.Invoice{}).Where("id = ?", invoiceID).Update("status", status).Error
}

func (r *paymentRepository) CompletePayment(tx *entity.PaymentTransaction, invoiceStatus entity.InvoiceStatus) error {
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		// Generate ReceiptNumber if it's a successful transaction and is not already set
		if tx.PaymentStatus == entity.PaymentSuccess && tx.ReceiptNumber == "" {
			var paidTime time.Time
			if tx.PaidAt != nil {
				paidTime = *tx.PaidAt
			} else {
				paidTime = time.Now()
			}
			issueStr := paidTime.Format("20060102")
			tx.ReceiptNumber = "REC-" + issueStr + "-" + fmt.Sprintf("%06d", tx.InvoiceID)
		}

		// 1. Update Payment Transaction
		if err := dbTx.Save(tx).Error; err != nil {
			return err
		}

		// If this is a successful transaction, cancel all other pending transactions for this invoice
		if tx.PaymentStatus == entity.PaymentSuccess {
			err := dbTx.Model(&entity.PaymentTransaction{}).
				Where("invoice_id = ? AND payment_status = ? AND id != ?", tx.InvoiceID, entity.PaymentPending, tx.ID).
				Update("payment_status", entity.PaymentCancelled).Error
			if err != nil {
				return err
			}
		}

		// 2. Update Invoice Status
		if err := dbTx.Model(&entity.Invoice{}).Where("id = ?", tx.InvoiceID).Update("status", invoiceStatus).Error; err != nil {
			return err
		}
		return nil
	})
}
// FindByHouseholdID ดึงประวัติการจ่ายเงินทั้งหมดของครัวเรือน 
func (r *paymentRepository) FindByHouseholdID(householdID uint) ([]entity.PaymentTransaction, error) {
	var payments []entity.PaymentTransaction
	// Join กับตาราง Invoice เพื่อให้สามารถฟิลเตอร์ด้วย household_id ได้
	// และทำการ Preload ข้อมูลที่เกี่ยวข้องอย่าง Invoice, WaterReading เพื่อนำไปแสดงในหน้าประวัติ
	err := r.db.
		Joins("JOIN invoices ON invoices.id = payment_transactions.invoice_id").
		Where("invoices.house_hold_id = ?", householdID).
		Preload("Invoice").
		Preload("Invoice.WaterReading").
		Preload("Invoice.GarbageReading").
		Order("payment_transactions.paid_at DESC"). // เรียงจากจ่ายล่าสุดขึ้นก่อน
		Find(&payments).Error
		
	if err != nil {
		return nil, err
	}
	return payments, nil
}

func (r *paymentRepository) GetStaffByUserID(userID uint) (*entity.Staff, error) {
	var staff entity.Staff
	err := r.db.Where("user_id = ?", userID).First(&staff).Error
	if err != nil {
		return nil, err
	}
	return &staff, nil
}

func (r *paymentRepository) GetSuccessTransactionByInvoiceID(invoiceID uint) (*entity.PaymentTransaction, error) {
	var tx entity.PaymentTransaction
	err := r.db.
		Preload("Invoice").
		Preload("Invoice.HouseHold").
		Preload("Invoice.HouseHold.Village").
		Preload("Invoice.HouseHold.Village.Subdistrict").
		Preload("Invoice.HouseHold.Village.Subdistrict.District").
		Preload("Invoice.HouseHold.Village.Subdistrict.District.Province").
		Preload("Invoice.HouseHold.Village.Subdistrict.SubdistrictInfo").
		Preload("Invoice.WaterReading").
		Preload("Invoice.GarbageReading").
		Preload("Invoice.GarbageReading.GarbageReadingDetails").
		Preload("Invoice.GarbageReading.GarbageReadingDetails.GarbageSize").
		Preload("Staff").
		Where("invoice_id = ? AND payment_status = ?", invoiceID, entity.PaymentSuccess).
		Order("id DESC").
		First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *paymentRepository) GetPreviousWaterReading(householdID uint, currentReadingDate time.Time) (*entity.WaterReading, error) {
	var wr entity.WaterReading
	err := r.db.
		Where("house_hold_id = ? AND reading_date < ?", householdID, currentReadingDate).
		Order("reading_date DESC, id DESC").
		First(&wr).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &wr, nil
}

