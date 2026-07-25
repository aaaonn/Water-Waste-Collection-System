package invoice

import (
	"backend/entity"
	"gorm.io/gorm"
)

// InvoiceRepository คือ interface ที่กำหนดพฤติกรรมการเข้าถึงฐานข้อมูลของบิล (Invoices)
type InvoiceRepository interface {
	// FindByHouseholdID ค้นหาบิลทั้งหมดของครัวเรือนนั้นๆ โดยสามารถกรองสถานะ (status) ได้
	FindByHouseholdID(householdID uint, status string) ([]entity.Invoice, error)
	// FindByID ค้นหาบิลจาก ID
	FindByID(id uint) (*entity.Invoice, error)
}

// invoiceRepository เป็น struct ที่ใช้คุยกับฐานข้อมูลผ่าน GORM
type invoiceRepository struct {
	db *gorm.DB
}

// NewInvoiceRepository คืนค่า instance ของ invoiceRepository เพื่อเอาไปใช้งานต่อ
func NewInvoiceRepository(db *gorm.DB) InvoiceRepository {
	return &invoiceRepository{db: db}
}

func (r *invoiceRepository) FindByHouseholdID(householdID uint, status string) ([]entity.Invoice, error) {
	var invoices []entity.Invoice
	// เตรียม query โดยเลือกเฉพาะบิลของครัวเรือนนี้ และดึงข้อมูลมิเตอร์น้ำกับขยะมาพร้อมกัน (Preload)
	query := r.db.Where("house_hold_id = ?", householdID).Preload("WaterReading").Preload("GarbageReading")
	
	// ถ้ามีการส่ง status มาให้กรองข้อมูล (เช่น 'pending' หรือ 'paid')
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// ค้นหาและเรียงลำดับตามวันที่ออกบิลล่าสุดก่อน (DESC)
	if err := query.Order("issue_date DESC").Find(&invoices).Error; err != nil {
		return nil, err
	}
	return invoices, nil
}

func (r *invoiceRepository) FindByID(id uint) (*entity.Invoice, error) {
	var invoice entity.Invoice
	// ค้นหาบิลพร้อมดึงข้อมูลที่เกี่ยวข้องมาด้วย
	if err := r.db.Preload("WaterReading").Preload("GarbageReading").First(&invoice, id).Error; err != nil {
		return nil, err
	}
	return &invoice, nil
}
