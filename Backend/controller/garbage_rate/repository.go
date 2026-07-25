package garbage_rate

import (
	"backend/entity"
	"gorm.io/gorm"
)

// GarbageRateRepository อินเตอร์เฟสสำหรับจัดการข้อมูล GarbageSizeCost ใน Database
type GarbageRateRepository interface {
	GetAll(subdistrictID uint) ([]entity.GarbageSizeCost, error)
	GetByID(id uint) (*entity.GarbageSizeCost, error)
	GetBySizeAndSubdistrict(size string, subdistrictID uint) (*entity.GarbageSizeCost, error)
	Create(g *entity.GarbageSizeCost) error
	Update(g *entity.GarbageSizeCost) error
	Delete(id uint) error
}

type garbageRateRepository struct {
	db *gorm.DB
}

// NewGarbageRateRepository สร้างอินสแตนซ์ของ Repository
func NewGarbageRateRepository(db *gorm.DB) GarbageRateRepository {
	return &garbageRateRepository{db: db}
}

// GetAll ดึงข้อมูลอัตราค่าบริการขยะทั้งหมด รองรับการกรองตามตำบล
func (r *garbageRateRepository) GetAll(subdistrictID uint) ([]entity.GarbageSizeCost, error) {
	var list []entity.GarbageSizeCost
	query := r.db.Preload("Subdistrict").Order("subdistrict_id, cost")
	
	if subdistrictID > 0 {
		query = query.Where("subdistrict_id = ?", subdistrictID)
	}

	err := query.Find(&list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

// GetByID ดึงข้อมูลตาม ID
func (r *garbageRateRepository) GetByID(id uint) (*entity.GarbageSizeCost, error) {
	var g entity.GarbageSizeCost
	err := r.db.Preload("Subdistrict").First(&g, id).Error
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// GetBySizeAndSubdistrict ดึงข้อมูลตามขนาดถังและรหัสตำบล (เพื่อเช็กซ้ำ)
func (r *garbageRateRepository) GetBySizeAndSubdistrict(size string, subdistrictID uint) (*entity.GarbageSizeCost, error) {
	var g entity.GarbageSizeCost
	err := r.db.Where("size_name = ? AND subdistrict_id = ?", size, subdistrictID).First(&g).Error
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// Create บันทึกข้อมูลใหม่ลงฐานข้อมูล
func (r *garbageRateRepository) Create(g *entity.GarbageSizeCost) error {
	return r.db.Create(g).Error
}

// Update อัปเดตข้อมูลเดิมในฐานข้อมูล
func (r *garbageRateRepository) Update(g *entity.GarbageSizeCost) error {
	return r.db.Save(g).Error
}

// Delete ลบข้อมูลอัตราค่าขยะ (Soft Delete)
func (r *garbageRateRepository) Delete(id uint) error {
	// GORM จะทำ Soft Delete โดยอัตโนมัติเนื่องจากมี gorm.Model ใน struct GarbageSizeCost
	return r.db.Delete(&entity.GarbageSizeCost{}, id).Error
}
