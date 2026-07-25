export interface InvoiceResponse {
  id: number;
  household_id: number;
  status: string;
  total_amount: number;
  issue_date: string;
  due_date: string;
  external_ref: string;
  water_reading_id: number;
  garbage_reading_id: number;
  
  // Preloaded data
  water_unit_consumed: number;
  water_prev_reading: number;
  water_curr_reading: number;
  water_reading_amount: number;
}
