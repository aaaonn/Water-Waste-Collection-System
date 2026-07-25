package invoice_and_receipt

import (
	"backend/entity"
	"time"

	"gorm.io/gorm"
)

type InvoiceReceiptRepository interface {
	GetInvoiceByHouseholdAndDate(householdID uint, subdistrictID uint, start, end time.Time) (*entity.Invoice, error)
	GetPreviousWaterReading(householdID uint, currentReadingDate time.Time) (*entity.WaterReading, error)
}

type invoiceReceiptRepository struct {
	db *gorm.DB
}

func NewInvoiceReceiptRepository(db *gorm.DB) InvoiceReceiptRepository {
	return &invoiceReceiptRepository{db: db}
}

func (r *invoiceReceiptRepository) GetInvoiceByHouseholdAndDate(householdID uint, subdistrictID uint, start, end time.Time) (*entity.Invoice, error) {
	var inv entity.Invoice
	err := r.db.Preload("HouseHold.Village.Subdistrict.District.Province").
		Preload("HouseHold.Village.Subdistrict.SubdistrictInfo").
		Preload("WaterReading").
		Preload("GarbageReading.GarbageReadingDetails.GarbageSize").
		Preload("PaymentTransactions.Staff").
		Preload("PaymentTransactions", func(db *gorm.DB) *gorm.DB {
			return db.Order("payment_transactions.paid_at DESC, payment_transactions.id DESC")
		}).
		Joins("JOIN house_holds ON house_holds.id = invoices.house_hold_id").
		Joins("JOIN villages ON villages.id = house_holds.village_id").
		Where("invoices.house_hold_id = ? AND villages.subdistrict_id = ? AND invoices.issue_date >= ? AND invoices.issue_date <= ? AND invoices.status != ?",
			householdID, subdistrictID, start, end, entity.InvoiceCancelled).
		First(&inv).Error

	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *invoiceReceiptRepository) GetPreviousWaterReading(householdID uint, currentReadingDate time.Time) (*entity.WaterReading, error) {
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
