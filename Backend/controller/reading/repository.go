package reading

import (
	"backend/entity"
	"time"

	"gorm.io/gorm"
)

// ReadingRepository อินเตอร์เฟสสำหรับจัดการฐานข้อมูลการจดบันทึกมิเตอร์
type ReadingRepository interface {
	GetLastWaterReading(householdID uint) (*entity.WaterReading, error)
	GetLastGarbageReading(householdID uint) (*entity.GarbageReading, error)
	GetWaterUnitsBySubdistrict(subdistrictID uint) ([]entity.WaterUnit, error)
	GetHouseholdWithVillage(householdID uint) (*entity.HouseHold, error)
	CreateWaterReading(wr *entity.WaterReading) error
	GetGarbageSizeCost(id uint) (*entity.GarbageSizeCost, error)
	CreateGarbageReading(gr *entity.GarbageReading) error
	CreateInvoice(invoice *entity.Invoice) error
	GetInvoiceByMonthAndYear(householdID uint, start, end time.Time) (*entity.Invoice, error)
	UpdateInvoice(invoice *entity.Invoice) error
	GetStaffIDByUserID(userID uint) (uint, error)
	GetLastWaterReadingBeforeDate(householdID uint, date time.Time) (*entity.WaterReading, error)
	GetWaterReadingByMonthAndYear(householdID uint, start, end time.Time) (*entity.WaterReading, error)
	GetGarbageReadingByMonthAndYear(householdID uint, start, end time.Time) (*entity.GarbageReading, error)
	UpdateWaterReading(wr *entity.WaterReading) error
	UpdateGarbageReading(gr *entity.GarbageReading) error
	DeleteGarbageReadingDetails(garbageReadingID uint) error
	GetWaterUnitHistory(subdistrictID uint, month int, year int) ([]entity.WaterUnitHistory, error)
	CreateWaterUnitHistory(history []entity.WaterUnitHistory) error
}

type readingRepository struct {
	db *gorm.DB
}

// NewReadingRepository สร้างอินสแตนซ์ของ Repository
func NewReadingRepository(db *gorm.DB) ReadingRepository {
	return &readingRepository{db: db}
}

func (r *readingRepository) GetLastWaterReading(householdID uint) (*entity.WaterReading, error) {
	var wr entity.WaterReading
	err := r.db.Where("house_hold_id = ?", householdID).Order("reading_date DESC, id DESC").First(&wr).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // ยังไม่เคยบันทึกมิเตอร์มาก่อนเลย
		}
		return nil, err
	}
	return &wr, nil
}

func (r *readingRepository) GetWaterUnitsBySubdistrict(subdistrictID uint) ([]entity.WaterUnit, error) {
	var units []entity.WaterUnit
	err := r.db.Where("subdistrict_id = ?", subdistrictID).Order("start_unit").Find(&units).Error
	if err != nil {
		return nil, err
	}
	return units, nil
}

func (r *readingRepository) GetHouseholdWithVillage(householdID uint) (*entity.HouseHold, error) {
	var h entity.HouseHold
	err := r.db.Preload("Village").First(&h, householdID).Error
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *readingRepository) CreateWaterReading(wr *entity.WaterReading) error {
	return r.db.Create(wr).Error
}

func (r *readingRepository) GetGarbageSizeCost(id uint) (*entity.GarbageSizeCost, error) {
	var gc entity.GarbageSizeCost
	err := r.db.First(&gc, id).Error
	if err != nil {
		return nil, err
	}
	return &gc, nil
}

func (r *readingRepository) CreateGarbageReading(gr *entity.GarbageReading) error {
	return r.db.Create(gr).Error
}

func (r *readingRepository) GetLastGarbageReading(householdID uint) (*entity.GarbageReading, error) {
	var gr entity.GarbageReading
	err := r.db.Preload("GarbageReadingDetails.GarbageSize").
		Where("house_hold_id = ?", householdID).
		Order("reading_date DESC, id DESC").
		First(&gr).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // ยังไม่เคยบันทึกประวัติขยะมาก่อนเลย
		}
		return nil, err
	}
	return &gr, nil
}

func (r *readingRepository) CreateInvoice(invoice *entity.Invoice) error {
	return r.db.Create(invoice).Error
}

func (r *readingRepository) GetInvoiceByMonthAndYear(householdID uint, start, end time.Time) (*entity.Invoice, error) {
	var invoice entity.Invoice
	err := r.db.Preload("WaterReading").Preload("GarbageReading").Where("house_hold_id = ? AND issue_date >= ? AND issue_date <= ? AND status != ?",
		householdID, start, end, entity.InvoiceCancelled).
		First(&invoice).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &invoice, nil
}

func (r *readingRepository) UpdateInvoice(invoice *entity.Invoice) error {
	return r.db.Save(invoice).Error
}

func (r *readingRepository) GetStaffIDByUserID(userID uint) (uint, error) {
	var staff entity.Staff
	err := r.db.Where("user_id = ?", userID).First(&staff).Error
	if err != nil {
		return 0, err
	}
	return staff.ID, nil
}

func (r *readingRepository) GetLastWaterReadingBeforeDate(householdID uint, date time.Time) (*entity.WaterReading, error) {
	var wr entity.WaterReading
	err := r.db.Where("house_hold_id = ? AND reading_date < ?", householdID, date).Order("reading_date DESC, id DESC").First(&wr).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &wr, nil
}

func (r *readingRepository) GetWaterReadingByMonthAndYear(householdID uint, start, end time.Time) (*entity.WaterReading, error) {
	var wr entity.WaterReading
	err := r.db.Where("house_hold_id = ? AND reading_date >= ? AND reading_date <= ?", householdID, start, end).First(&wr).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &wr, nil
}

func (r *readingRepository) GetGarbageReadingByMonthAndYear(householdID uint, start, end time.Time) (*entity.GarbageReading, error) {
	var gr entity.GarbageReading
	err := r.db.Preload("GarbageReadingDetails").Where("house_hold_id = ? AND reading_date >= ? AND reading_date <= ?", householdID, start, end).First(&gr).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &gr, nil
}

func (r *readingRepository) UpdateWaterReading(wr *entity.WaterReading) error {
	return r.db.Save(wr).Error
}

func (r *readingRepository) UpdateGarbageReading(gr *entity.GarbageReading) error {
	return r.db.Save(gr).Error
}

func (r *readingRepository) DeleteGarbageReadingDetails(garbageReadingID uint) error {
	return r.db.Where("garbage_reading_id = ?", garbageReadingID).Delete(&entity.GarbageReadingDetail{}).Error
}

func (r *readingRepository) GetWaterUnitHistory(subdistrictID uint, month int, year int) ([]entity.WaterUnitHistory, error) {
	var history []entity.WaterUnitHistory
	err := r.db.Where("subdistrict_id = ? AND month = ? AND year = ?", subdistrictID, month, year).Order("start_unit").Find(&history).Error
	if err != nil {
		return nil, err
	}
	return history, nil
}

func (r *readingRepository) CreateWaterUnitHistory(history []entity.WaterUnitHistory) error {
	return r.db.Create(&history).Error
}


