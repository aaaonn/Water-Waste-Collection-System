package dashboard

import (
	"backend/entity"
	"strconv"
	"time"

	"gorm.io/gorm"
)

type DashboardRepository interface {
	GetStatsBySubdistrict(subdistrictID uint, month int, year int, villageID uint) (*DashboardStatsResponse, error)
}

type dashboardRepository struct {
	db *gorm.DB
}

func NewDashboardRepository(db *gorm.DB) DashboardRepository {
	return &dashboardRepository{db: db}
}

func (r *dashboardRepository) GetStatsBySubdistrict(subdistrictID uint, month int, year int, villageID uint) (*DashboardStatsResponse, error) {
	var totalHouseholds int64
	var activeHouseholds int64
	var unpaidInvoices int64
	var totalInvoices int64
	var overdueInvoices int64
	var householdsPaid int64

	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	// Helper function for HouseHold base query
	hhBase := func() *gorm.DB {
		q := r.db.Model(&entity.HouseHold{}).
			Joins("JOIN villages ON house_holds.village_id = villages.id").
			Where("villages.subdistrict_id = ?", subdistrictID)
		if villageID > 0 {
			q = q.Where("house_holds.village_id = ?", villageID)
		}
		return q
	}

	// Helper function for Invoice base query
	invBase := func() *gorm.DB {
		q := r.db.Model(&entity.Invoice{}).
			Joins("JOIN house_holds ON invoices.house_hold_id = house_holds.id").
			Joins("JOIN villages ON house_holds.village_id = villages.id").
			Where("villages.subdistrict_id = ?", subdistrictID)
		if villageID > 0 {
			q = q.Where("house_holds.village_id = ?", villageID)
		}
		return q
	}

	// 1. จำนวนครัวเรือนทั้งหมด
	err := hhBase().Count(&totalHouseholds).Error
	if err != nil {
		return nil, err
	}

	// 2. จำนวนครัวเรือนที่ใช้งานอยู่ (Active)
	err = hhBase().Where("house_holds.water_status = ? OR house_holds.garbage_status = ?", entity.StatusActive, entity.StatusActive).
		Count(&activeHouseholds).Error
	if err != nil {
		return nil, err
	}

	// 3. งานค้างรับ (ใบแจ้งหนี้ Pending ของเดือนนี้)
	err = invBase().Where("invoices.status = ? AND invoices.issue_date BETWEEN ? AND ?", entity.InvoicePending, startDate, endDate).
		Count(&unpaidInvoices).Error
	if err != nil {
		return nil, err
	}

	// 3.1 จำนวนบิลทั้งหมดของเดือนนี้
	err = invBase().Where("invoices.issue_date BETWEEN ? AND ?", startDate, endDate).
		Count(&totalInvoices).Error
	if err != nil {
		return nil, err
	}

	// 4. ค้างชำระ (Overdue จากเดือนก่อนหน้าลงไป)
	err = invBase().Where("invoices.status = ? AND invoices.issue_date < ?", entity.InvoiceOverdue, startDate).
		Count(&overdueInvoices).Error
	if err != nil {
		return nil, err
	}

	// 5. คำนวณรายได้ทั้งหมด (Expected vs Collected)
	var totalRevenueExpected, totalRevenueCollected float64
	invBase().Where("invoices.issue_date BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(invoices.total_amount), 0) as expected, COALESCE(SUM(CASE WHEN invoices.status = 'paid' THEN invoices.total_amount ELSE 0 END), 0) as collected").
		Row().Scan(&totalRevenueExpected, &totalRevenueCollected)

	// 6. จำนวนบ้านที่จ่ายแล้ว (Households Paid)
	err = invBase().Where("invoices.status = ? AND invoices.issue_date BETWEEN ? AND ?", entity.InvoicePaid, startDate, endDate).
		Distinct("invoices.house_hold_id").
		Count(&householdsPaid).Error
	if err != nil {
		return nil, err
	}

	// 7. ความคืบหน้าการจัดเก็บค่าน้ำและขยะ
	var waterCollected, waterTotal float64
	invBase().Joins("JOIN water_readings ON invoices.water_reading_id = water_readings.id").
		Where("invoices.water_reading_id IS NOT NULL AND invoices.issue_date BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(CASE WHEN invoices.status = 'paid' THEN water_readings.total_amount ELSE 0 END), 0) as collected, COALESCE(SUM(water_readings.total_amount), 0) as total").
		Row().Scan(&waterCollected, &waterTotal)

	var garbageCollected, garbageTotal float64
	invBase().Joins("JOIN garbage_readings ON invoices.garbage_reading_id = garbage_readings.id").
		Where("invoices.garbage_reading_id IS NOT NULL AND invoices.issue_date BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(CASE WHEN invoices.status = 'paid' THEN garbage_readings.total_amount ELSE 0 END), 0) as collected, COALESCE(SUM(garbage_readings.total_amount), 0) as total").
		Row().Scan(&garbageCollected, &garbageTotal)

	waterPct := 0
	if waterTotal > 0 {
		waterPct = int((waterCollected / waterTotal) * 100)
	}

	garbagePct := 0
	if garbageTotal > 0 {
		garbagePct = int((garbageCollected / garbageTotal) * 100)
	}

	// 8. แนวโน้มรายได้ย้อนหลัง 6 เดือนล่าสุด
	chartData := make([]MonthlyRevenueData, 0)
	now := time.Now()
	monthsEng := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}

	for i := 5; i >= 0; i-- {
		monthDate := now.AddDate(0, -i, 0)
		monthStart := time.Date(monthDate.Year(), monthDate.Month(), 1, 0, 0, 0, 0, time.UTC)
		monthEnd := monthStart.AddDate(0, 1, 0).Add(-time.Second)

		var mWater, mGarbage float64

		invBase().Joins("JOIN water_readings ON invoices.water_reading_id = water_readings.id").
			Where("invoices.status = ? AND invoices.water_reading_id IS NOT NULL AND invoices.issue_date BETWEEN ? AND ?", entity.InvoicePaid, monthStart, monthEnd).
			Select("COALESCE(SUM(water_readings.total_amount), 0)").
			Scan(&mWater)

		invBase().Joins("JOIN garbage_readings ON invoices.garbage_reading_id = garbage_readings.id").
			Where("invoices.status = ? AND invoices.garbage_reading_id IS NOT NULL AND invoices.issue_date BETWEEN ? AND ?", entity.InvoicePaid, monthStart, monthEnd).
			Select("COALESCE(SUM(garbage_readings.total_amount), 0)").
			Scan(&mGarbage)

		maxVal := 100000.0
		wHeight := (mWater / maxVal) * 100
		if wHeight > 100 { wHeight = 100 }

		gHeight := (mGarbage / maxVal) * 100
		if gHeight > 100 { gHeight = 100 }

		chartData = append(chartData, MonthlyRevenueData{
			Month:   monthsEng[monthDate.Month()-1],
			Water:   wHeight,
			Garbage: gHeight,
		})
	}

	revenueCollectedStr := strconv.FormatFloat(totalRevenueCollected, 'f', 0, 64)
	revenueTotalStr := strconv.FormatFloat(totalRevenueExpected, 'f', 0, 64)
	householdsPaidStr := strconv.FormatInt(householdsPaid, 10)
	householdsActiveStr := strconv.FormatInt(activeHouseholds, 10)
	householdsTotalStr := strconv.FormatInt(totalHouseholds, 10)
	tasksCount := int(unpaidInvoices)
	totalTasksCount := int(totalInvoices)
	alertsCount := int(overdueInvoices)

	// We now return the real fetched data directly without mocking
	
	// Calculate Survey Progress
	surveyed := int(totalInvoices)
	unsurveyed := int(activeHouseholds) - surveyed
	if unsurveyed < 0 { unsurveyed = 0 }
	
	surveyPct := 0
	if activeHouseholds > 0 {
		surveyPct = int((float64(surveyed) / float64(activeHouseholds)) * 100)
		if surveyPct > 100 { surveyPct = 100 }
	}

	return &DashboardStatsResponse{
		RevenueCollected: revenueCollectedStr,
		RevenueTotal:     revenueTotalStr,
		HouseholdsPaid:   householdsPaidStr,
		HouseholdsActive: householdsActiveStr,
		HouseholdsTotal:  householdsTotalStr,
		PendingTasks:     tasksCount,
		TotalTasks:       totalTasksCount,
		SystemAlerts:     alertsCount,
		WaterProgress: ProgressData{
			Percentage: waterPct,
			Target:     waterTotal,
			Collected:  waterCollected,
		},
		GarbageProgress: ProgressData{
			Percentage: garbagePct,
			Target:     garbageTotal,
			Collected:  garbageCollected,
		},
		SurveyProgress: SurveyProgressData{
			TotalActive: int(activeHouseholds),
			Surveyed:    surveyed,
			Unsurveyed:  unsurveyed,
			Percentage:  surveyPct,
		},
		ChartData: chartData,
	}, nil
}
