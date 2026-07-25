package core

import (
	"backend/controller/garbage_rate"
	"backend/controller/household"
	"backend/controller/household_account"
	"backend/controller/reading"
	"backend/controller/village"
	"backend/controller/water_unit"
	"backend/mobile_controller/householde_list"
	"backend/mobile_controller/invoice_and_receipt"
	webLogin "backend/controller/login"
	mobileLogin "backend/mobile_controller/login"
	"backend/mobile_controller/village_list"
	"gorm.io/gorm"
	"backend/controller/userstaff"
	"backend/controller/invoice"
	"backend/controller/payment"
	"backend/controller/organization"
	"backend/controller/dashboard"
)

// AppContainer เป็นคลังเก็บ Handler ทั้งระบบ
type AppContainer struct {
	AuthHandler            *mobileLogin.AuthHandler
	WebAuthHandler         *webLogin.AuthHandler
	DashboardHandler       *dashboard.DashboardHandler
	MobileHouseholdHandler *householde_list.MobileHouseholdHandler
	MobileVillageHandler   *village_list.MobileVillageHandler
	WaterUnitHandler       *water_unit.WaterUnitHandler
	VillageHandler         *village.VillageHandler
	HouseholdHandler       *household.HouseholdHandler
	ReadingHandler         *reading.ReadingHandler
	GarbageRateHandler     *garbage_rate.GarbageRateHandler
	UserstaffHandler   *userstaff.UserstaffHandler
	InvoiceHandler     *invoice.InvoiceHandler
	PaymentHandler     *payment.PaymentHandler
	InvoiceReceiptHandler  *invoice_and_receipt.InvoiceReceiptHandler
	OrganizationHandler *organization.OrganizationHandler
	HouseholdAccountWebHandler *household_account.HouseholdAccountWebHandler
}

// NewAppContainer ทำหน้าที่ประกอบบล็อกเลโก้ทั้งระบบที่นี่ที่เดียว
func NewAppContainer(db *gorm.DB) *AppContainer {

	// mobile login
	userRepo := mobileLogin.NewUserRepository(db)
	authService := mobileLogin.NewAuthService(userRepo)

	// web login
	webUserRepo := webLogin.NewUserRepository(db)
	webAuthService := webLogin.NewAuthService(webUserRepo)

	// dashboard stats
	dashboardRepo := dashboard.NewDashboardRepository(db)
	dashboardService := dashboard.NewDashboardService(dashboardRepo)

	// mobile household list API
	mobileHouseholdRepo := householde_list.NewMobileHouseholdRepository(db)
	mobileHouseholdService := householde_list.NewMobileHouseholdService(mobileHouseholdRepo)

	// mobile village list API
	mobileVillageRepo := village_list.NewMobileVillageRepository(db)
	mobileVillageService := village_list.NewMobileVillageService(mobileVillageRepo)

	// water unit CRUD
	waterUnitRepo := water_unit.NewWaterUnitRepository(db)
	waterUnitService := water_unit.NewWaterUnitService(waterUnitRepo)

	// village API
	villageRepo := village.NewVillageRepository(db)
	villageService := village.NewVillageService(villageRepo)

	// household API
	householdRepo := household.NewHouseholdRepository(db)
	householdService := household.NewHouseholdService(householdRepo)

	// meter reading API
	readingRepo := reading.NewReadingRepository(db)
	readingService := reading.NewReadingService(readingRepo)

	// garbage rate API
	garbageRateRepo := garbage_rate.NewGarbageRateRepository(db)
	garbageRateService := garbage_rate.NewGarbageRateService(garbageRateRepo)

	// userstaff API
	userstaffRepo := userstaff.NewUserstaffRepository(db)
	userstaffService := userstaff.NewUserstaffService(userstaffRepo)

	// payment API (Omise PromptPay)
	// invoice API
	invoiceRepo := invoice.NewInvoiceRepository(db)
	invoiceService := invoice.NewInvoiceService(invoiceRepo)

	// payment API
	paymentRepo := payment.NewPaymentRepository(db)
	paymentService := payment.NewPaymentService(paymentRepo)

	// mobile invoice and receipt API
	invoiceReceiptRepo := invoice_and_receipt.NewInvoiceReceiptRepository(db)
	invoiceReceiptService := invoice_and_receipt.NewInvoiceReceiptService(invoiceReceiptRepo)
	// organization API
	organizationRepo := organization.NewOrganizationRepository(db)
	organizationService := organization.NewOrganizationService(organizationRepo)

	// household account (web) API
	householdAccountRepo := household_account.NewHouseholdAccountRepository(db)
	householdAccountService := household_account.NewHouseholdAccountService(householdAccountRepo)

	// Handlers (ประกอบเสร็จแล้วจับยัดใส่กล่องรวม)
	return &AppContainer{
		AuthHandler:            mobileLogin.NewAuthHandler(authService),
		WebAuthHandler:         webLogin.NewAuthHandler(webAuthService),
		DashboardHandler:       dashboard.NewDashboardHandler(dashboardService),
		MobileHouseholdHandler: householde_list.NewMobileHouseholdHandler(mobileHouseholdService),
		MobileVillageHandler:   village_list.NewMobileVillageHandler(mobileVillageService),
		WaterUnitHandler:       water_unit.NewWaterUnitHandler(waterUnitService),
		VillageHandler:         village.NewVillageHandler(villageService),
		HouseholdHandler:       household.NewHouseholdHandler(householdService),
		ReadingHandler:         reading.NewReadingHandler(readingService),
		GarbageRateHandler:     garbage_rate.NewGarbageRateHandler(garbageRateService),		
		UserstaffHandler:   userstaff.NewUserstaffHandler(userstaffService),
		InvoiceHandler:     invoice.NewInvoiceHandler(invoiceService),
		PaymentHandler:     payment.NewPaymentHandler(paymentService),
		InvoiceReceiptHandler:  invoice_and_receipt.NewInvoiceReceiptHandler(invoiceReceiptService),
		OrganizationHandler: organization.NewOrganizationHandler(organizationService),
		HouseholdAccountWebHandler: household_account.NewHouseholdAccountWebHandler(householdAccountService),
	}
}