package entity

type PaymentMethod string

const (
	MethodCash         PaymentMethod = "cash"
	MethodQRPromptpay  PaymentMethod = "QR_Promptpay"
)
