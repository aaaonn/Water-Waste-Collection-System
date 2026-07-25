export interface PaymentResponse {
  id: number;
  invoice_id: number;
  omise_transaction_id: string;
  payment_method: string;
  payment_status: string;
  external_ref: string;
  currency: string;
  paid_at: string;

  // Preloaded invoice data
  invoice_status: string;
  invoice_amount: number;
  invoice_issue_date: string;
  
  // Preloaded water reading data
  water_unit_consumed: number;
  water_prev_reading: number;
  water_curr_reading: number;
  water_reading_amount: number;
}
