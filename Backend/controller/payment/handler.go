package payment

import (
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// PaymentHandler รับ HTTP Request จาก Router
type PaymentHandler struct {
	service PaymentService
}

func NewPaymentHandler(s PaymentService) *PaymentHandler {
	return &PaymentHandler{service: s}
}

// CreatePromptPayCharge สร้างคิวอาร์โค้ดพร้อมเพย์ของ Omise
func (h *PaymentHandler) CreatePromptPayCharge(c *gin.Context) {
	var req CreatePromptPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลคำขอไม่ถูกต้อง: " + err.Error()})
		return
	}

	res, err := h.service.CreatePromptPayCharge(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

// GetPaymentStatus ดึงสถานะการจ่ายเงินล่าสุดของใบแจ้งหนี้
func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	invoiceIDParam := c.Param("invoice_id")
	invoiceID, err := strconv.ParseUint(invoiceIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสใบแจ้งหนี้รูปแบบไม่ถูกต้อง"})
		return
	}

	res, err := h.service.GetPaymentStatus(uint(invoiceID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// ProcessWebhook ตัวรับข้อมูล Webhook จาก Omise
func (h *PaymentHandler) ProcessWebhook(c *gin.Context) {
	signatureHeader := c.GetHeader("Omise-Signature")
	timestampHeader := c.GetHeader("Omise-Signature-Timestamp")

	if signatureHeader == "" || timestampHeader == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing signature headers"})
		return
	}

	// อ่าน raw body
	rawBody, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read request body"})
		return
	}

	err = h.service.ProcessWebhook(signatureHeader, timestampHeader, rawBody)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OK"})
}

// GetByHouseholdID ฟังก์ชันจัดการ request เพื่อดึงประวัติการจ่ายเงินทั้งหมดของบ้านหนึ่งๆ
// HTTP GET /api/households/:id/payments
func (h *PaymentHandler) GetByHouseholdID(c *gin.Context) {
	// อ่านและตรวจสอบค่าพารามิเตอร์ ID
	idParam := c.Param("id")
	householdID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid household ID"})
		return
	}

	// ส่ง ID ให้ Service ไปทำต่อ
	payments, err := h.service.GetPaymentsByHouseholdID(uint(householdID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// คืนค่าผลลัพธ์เป็น JSON
	c.JSON(http.StatusOK, gin.H{"data": payments})
}

// CreateCashPayment บันทึกการชำระเงินด้วยเงินสด
func (h *PaymentHandler) CreateCashPayment(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบสิทธิ์การเข้าถึง"})
		return
	}

	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "สิทธิ์การเข้าถึงไม่ถูกต้อง"})
		return
	}

	var req CreateCashPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลคำขอไม่ถูกต้อง: " + err.Error()})
		return
	}

	res, err := h.service.CreateCashPayment(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

// GetReceipt ดึงข้อมูลใบเสร็จสำหรับการชำระเงินที่สำเร็จ
func (h *PaymentHandler) GetReceipt(c *gin.Context) {
	idParam := c.Param("invoice_id")
	invoiceID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "หมายเลขใบแจ้งหนี้ไม่ถูกต้อง"})
		return
	}

	res, err := h.service.GetReceiptByInvoiceID(uint(invoiceID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// StreamPaymentStatus opens an SSE connection to stream payment status events to the client
func (h *PaymentHandler) StreamPaymentStatus(c *gin.Context) {
	invoiceIDParam := c.Param("invoice_id")
	invoiceID, err := strconv.ParseUint(invoiceIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสใบแจ้งหนี้รูปแบบไม่ถูกต้อง"})
		return
	}

	// 1. Subscribe to the payment broker for updates on this invoice ID
	eventChan := GlobalBroker.Subscribe(uint(invoiceID))
	defer GlobalBroker.Unsubscribe(uint(invoiceID), eventChan)

	// 2. Set headers required for Server-Sent Events (SSE)
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")

	// 3. Prevent connection timeout using a 20-second keep-alive ping ticker
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	c.Stream(func(w io.Writer) bool {
		select {
		case status, ok := <-eventChan:
			if !ok {
				return false
			}
			// Send the updated payment status event to the client
			c.SSEvent("payment_status", gin.H{
				"invoice_id": invoiceID,
				"status":     status,
			})
			return false // Close connection once a terminal status is received (success/failed)
		case <-ticker.C:
			// Send keep-alive ping to prevent router or proxy timeouts
			c.SSEvent("ping", "keepalive")
			return true
		case <-c.Request.Context().Done():
			// Client disconnected, close connection gracefully
			return false
		}
	})
}
