package payment

import (
	"sync"
)

type PaymentBroker struct {
	mu        sync.RWMutex
	listeners map[uint]chan string // key: invoice_id, value: channel for payment status
}

var GlobalBroker = &PaymentBroker{
	listeners: make(map[uint]chan string),
}

// Subscribe registers a listener for a specific invoice ID
func (b *PaymentBroker) Subscribe(invoiceID uint) chan string {
	b.mu.Lock()
	defer b.mu.Unlock()

	ch := make(chan string, 1)
	b.listeners[invoiceID] = ch
	return ch
}

// Unsubscribe removes a listener for a specific invoice ID
func (b *PaymentBroker) Unsubscribe(invoiceID uint, ch chan string) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if currentCh, exists := b.listeners[invoiceID]; exists && currentCh == ch {
		close(ch)
		delete(b.listeners, invoiceID)
	}
}

// Publish broadcasts the payment status update to the listener
func (b *PaymentBroker) Publish(invoiceID uint, status string) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	if ch, exists := b.listeners[invoiceID]; exists {
		select {
		case ch <- status:
		default:
			// Prevent blocking if the channel is full or client disconnected
		}
	}
}
