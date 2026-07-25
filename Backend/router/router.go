package router

import (
	"backend/core"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes ตั้งค่า API Routes ของระบบทั้งหมด
func SetupRoutes(r *gin.Engine, container *core.AppContainer) {

	// กลุ่มที่ยังไม่ต้องล็อกอินก็เข้าถึงได้ เช่น หน้า login, register หรือหน้า public ต่างๆ
	api := r.Group("/api")
	{
		// login routes
		api.POST("/mobilelogin", container.AuthHandler.MobileLogin)
		api.POST("/login", container.WebAuthHandler.Login)
		mobile := api.Group("/mobile", middleware.AuthMiddleware())
		{
			mobile.POST("/households", container.MobileHouseholdHandler.GetMobileHouseholds)
			mobile.GET("/households/:id", container.MobileHouseholdHandler.GetMobileHouseholdByID)
			mobile.GET("/villages", container.MobileVillageHandler.GetMobileVillages)
			mobile.GET("/profile", container.AuthHandler.GetProfile)
			mobile.GET("/invoices/:id", container.InvoiceReceiptHandler.GetInvoice)
			mobile.GET("/receipts/:id", container.InvoiceReceiptHandler.GetReceipt)
			mobile.POST("/water-readings", container.ReadingHandler.CreateWaterReading)
			mobile.POST("/garbage-readings", container.ReadingHandler.CreateGarbageReading)
			mobile.GET("/garbage-rates", container.GarbageRateHandler.GetAll)
			mobile.GET("/water-units", container.WaterUnitHandler.GetAll)
		}

		// webhook routes (Omise - Public)
		api.POST("/payments/webhook", container.PaymentHandler.ProcessWebhook)

		// web routes (ต้องการล็อกอินก่อนเข้าใช้งาน)
		web := api.Group("/", middleware.AuthMiddleware())
		{
			// dashboard stats
			web.GET("/dashboard/stats", container.DashboardHandler.GetStats)

			// village & household routes
			web.GET("/villages", container.VillageHandler.GetAll)
			web.GET("/villages/:id", container.VillageHandler.GetByID)
			web.POST("/villages", container.VillageHandler.Create)
			web.PATCH("/villages/:id", container.VillageHandler.Update)
			web.DELETE("/villages/:id", container.VillageHandler.Delete)
			web.GET("/villages/:id/households", container.HouseholdHandler.GetByVillageID)
			web.GET("/households", container.HouseholdHandler.GetAll)
			web.GET("/households/me", container.HouseholdHandler.GetMe)
			web.GET("/households/:id", container.HouseholdHandler.GetByID)
			web.POST("/households/import", container.HouseholdHandler.Import)
			web.POST("/households", container.HouseholdHandler.Create)
			web.PATCH("/households/:id", container.HouseholdHandler.Update)
			web.DELETE("/households/:id", container.HouseholdHandler.Delete)

			// invoice routes
			web.GET("/households/:id/invoices", container.InvoiceHandler.GetByHouseholdID)

			// payment routes
			web.GET("/households/:id/payments", container.PaymentHandler.GetByHouseholdID)

			// meter reading routes
			web.GET("/households/:id/last-water-reading", container.ReadingHandler.GetLastWaterReading)
			web.GET("/households/:id/last-garbage-reading", container.ReadingHandler.GetLastGarbageReading)
			web.POST("/water-readings", container.ReadingHandler.CreateWaterReading)
			web.POST("/garbage-readings", container.ReadingHandler.CreateGarbageReading)

			// water unit CRUD routes
			web.GET("/water-units", container.WaterUnitHandler.GetAll)
			web.GET("/water-units/:id", container.WaterUnitHandler.GetByID)
			web.POST("/water-units", container.WaterUnitHandler.Create)
			web.PATCH("/water-units/:id", container.WaterUnitHandler.Update)
			web.DELETE("/water-units/:id", container.WaterUnitHandler.Delete)

			// garbage rate CRUD routes
			web.GET("/garbage-rates", container.GarbageRateHandler.GetAll)
			web.GET("/garbage-rates/:id", container.GarbageRateHandler.GetByID)
			web.POST("/garbage-rates", container.GarbageRateHandler.Create)
			web.PATCH("/garbage-rates/:id", container.GarbageRateHandler.Update)
			web.DELETE("/garbage-rates/:id", container.GarbageRateHandler.Delete)

			// userstaff routes (Admin & Staff Management)
			web.GET("/userstaffs", container.UserstaffHandler.GetAll)
			web.GET("/userstaffs/:id", container.UserstaffHandler.GetByID)
			web.POST("/userstaffs", container.UserstaffHandler.Create)
			web.PATCH("/userstaffs/:id", container.UserstaffHandler.Update)
			web.DELETE("/userstaffs/:id", container.UserstaffHandler.Delete)

			// payment routes (Omise PromptPay & Cash)
			web.POST("/payments/promptpay", container.PaymentHandler.CreatePromptPayCharge)
			web.POST("/payments/cash", container.PaymentHandler.CreateCashPayment)
			web.GET("/payments/status/:invoice_id", container.PaymentHandler.GetPaymentStatus)
			web.GET("/payments/stream/:invoice_id", container.PaymentHandler.StreamPaymentStatus)
			web.GET("/payments/receipt/:invoice_id", container.PaymentHandler.GetReceipt)

			// organization routes
			web.GET("/organization", container.OrganizationHandler.GetOrganization)
			web.PATCH("/organization", container.OrganizationHandler.UpdateOrganization)

			// Settings / Profile Route (Temporarily removed AuthMiddleware for mock testing)
			web.PATCH("/household-profile/:id", container.HouseholdAccountWebHandler.UpdateHouseholdProfile)
		}

		// web route
		// ในอนาคตถ้างอกค่าน้ำ ค่าขยะ ก็เขียนต่อที่นี่ได้เลย ไม่ต้องยุ่งกับ main
		// api.POST("/water/record", container.WaterHandler.Record)
	}

	// ถ้าในอนาคตมี route ที่ต้องการให้ล็อกอินก่อนถึงจะเข้าถึงได้ ก็สร้างกลุ่มใหม่ที่ใช้ middleware.AuthMiddleware() แล้วใส่ route ที่ต้องการเข้าไปในกลุ่มนั้น
	// auth := r.Group("/api/v1",middleware.AuthMiddleware())
	// {

	// }
}
