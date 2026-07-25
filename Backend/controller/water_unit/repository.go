package water_unit

import (
	"backend/entity"
	"gorm.io/gorm"
)

// WaterUnitRepository อินเตอร์เฟสสำหรับจัดการข้อมูล WaterUnit ใน Database
type WaterUnitRepository interface {
	Create(waterUnit *entity.WaterUnit) error
	GetByID(id uint) (*entity.WaterUnit, error)
	GetAll(subdistrictID uint) ([]entity.WaterUnit, error)
	Update(waterUnit *entity.WaterUnit) error
	Delete(id uint) error
	CheckOverlap(subdistrictID uint, start float64, end float64, excludeID uint) (bool, error)
	GetHistory(subdistrictID uint, month int, year int) ([]entity.WaterUnitHistory, error)
	SubdistrictExists(subdistrictID uint) (bool, error)
}

type waterUnitRepository struct {
	db *gorm.DB
}

// NewWaterUnitRepository สร้างอินสแตนซ์ของ Repository
func NewWaterUnitRepository(db *gorm.DB) WaterUnitRepository {
	return &waterUnitRepository{db: db}
}

func (r *waterUnitRepository) Create(waterUnit *entity.WaterUnit) error {
	return r.db.Create(waterUnit).Error
}

func (r *waterUnitRepository) GetByID(id uint) (*entity.WaterUnit, error) {
	var waterUnit entity.WaterUnit
	err := r.db.Preload("Subdistrict").First(&waterUnit, id).Error
	if err != nil {
		return nil, err
	}
	return &waterUnit, nil
}

func (r *waterUnitRepository) GetAll(subdistrictID uint) ([]entity.WaterUnit, error) {
	var waterUnits []entity.WaterUnit
	query := r.db.Preload("Subdistrict").Order("subdistrict_id, start_unit")
	
	if subdistrictID > 0 {
		query = query.Where("subdistrict_id = ?", subdistrictID)
	}
	
	err := query.Find(&waterUnits).Error
	if err != nil {
		return nil, err
	}
	return waterUnits, nil
}

func (r *waterUnitRepository) Update(waterUnit *entity.WaterUnit) error {
	return r.db.Save(waterUnit).Error
}

func (r *waterUnitRepository) Delete(id uint) error {
	// GORM จะทำ Soft Delete โดยอัตโนมัติหากมีฟิลด์ DeletedAt ใน gorm.Model
	return r.db.Delete(&entity.WaterUnit{}, id).Error
}

func (r *waterUnitRepository) CheckOverlap(subdistrictID uint, start float64, end float64, excludeID uint) (bool, error) {
	var count int64
	query := r.db.Model(&entity.WaterUnit{}).
		Where("subdistrict_id = ?", subdistrictID).
		Where("start_unit <= ? AND (end_unit >= ? OR end_unit IS NULL)", end, start)

	if excludeID > 0 {
		query = query.Where("id != ?", excludeID)
	}

	err := query.Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *waterUnitRepository) SubdistrictExists(subdistrictID uint) (bool, error) {
	var count int64
	err := r.db.Model(&entity.Subdistrict{}).Where("id = ?", subdistrictID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *waterUnitRepository) GetHistory(subdistrictID uint, month int, year int) ([]entity.WaterUnitHistory, error) {
	var history []entity.WaterUnitHistory
	query := r.db.Preload("Subdistrict").Where("subdistrict_id = ? AND month = ? AND year = ?", subdistrictID, month, year).Order("start_unit")
	err := query.Find(&history).Error
	if err != nil {
		return nil, err
	}
	return history, nil
}