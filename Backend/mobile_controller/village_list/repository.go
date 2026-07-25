package village_list

import (
	"backend/entity"
	"gorm.io/gorm"
)

// VillageRepository อินเตอร์เฟสสำหรับจัดการข้อมูล Village ใน Database
type VillageRepository interface {
	GetAll() ([]entity.Village, error)
}

type MobileVillageRepository struct {
	db *gorm.DB
}

// NewMobileVillageRepository สร้างอินสแตนซ์ของ Repository
func NewMobileVillageRepository(db *gorm.DB) VillageRepository {
	return &MobileVillageRepository{db: db}
}

// GetAll ดึงรายชื่อหมู่บ้านทั้งหมด เรียงตามหมายเลขหมู่บ้าน
func (r *MobileVillageRepository) GetAll() ([]entity.Village, error) {
	var villages []entity.Village
	err := r.db.Preload("Subdistrict").Order("village_number").Find(&villages).Error
	if err != nil {
		return nil, err
	}
	return villages, nil
}
