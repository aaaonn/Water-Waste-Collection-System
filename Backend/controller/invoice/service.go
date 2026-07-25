package invoice

// InvoiceService เป็น interface ควบคุม Business Logic สำหรับ Invoices
type InvoiceService interface {
	// GetInvoicesByHouseholdID ทำหน้าที่ไปบอก repository ให้ดึงข้อมูลมาให้ แล้วนำมาแปลงด้วย Schema
	GetInvoicesByHouseholdID(householdID uint, status string) ([]InvoiceResponse, error)
}

type invoiceService struct {
	repo InvoiceRepository
}

// NewInvoiceService สร้าง service ตัวใหม่โดยรับ repository เข้ามาใช้งาน
func NewInvoiceService(repo InvoiceRepository) InvoiceService {
	return &invoiceService{repo: repo}
}

func (s *invoiceService) GetInvoicesByHouseholdID(householdID uint, status string) ([]InvoiceResponse, error) {
	// สั่ง Repository ให้ดึงข้อมูล Invoice
	invoices, err := s.repo.FindByHouseholdID(householdID, status)
	if err != nil {
		return nil, err
	}
	
	// แปลงข้อมูลจากรูปแบบ Database ให้เป็นรูปแบบ Response (JSON) ก่อนส่งกลับ
	return ToInvoiceResponses(invoices), nil
}
