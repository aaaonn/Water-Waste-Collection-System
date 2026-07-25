package entity

type InvoiceStatus string

const (
	InvoicePending   InvoiceStatus = "pending"
	InvoicePaid      InvoiceStatus = "paid"
	InvoiceOverdue   InvoiceStatus = "overdue"
	InvoiceCancelled InvoiceStatus = "cancelled"
)
