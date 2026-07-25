import { httpClient } from "./http-client";
import { PaymentResponse } from "../interface/payment";

export async function getPaymentsByHousehold(householdId: number): Promise<{ data: PaymentResponse[] }> {
  return httpClient.get<{ data: PaymentResponse[] }>(`/households/${householdId}/payments`);
}

/**
 * สร้างคิวอาร์โค้ดพร้อมเพย์สำหรับใบแจ้งหนี้ผ่าน Omise API
 */
export async function createPromptPayCharge(invoiceId: number): Promise<{
  transaction_id: string;
  invoice_id: number;
  amount: number;
  currency: string;
  qr_code_url: string;
  status: string;
}> {
  return httpClient.post<{
    transaction_id: string;
    invoice_id: number;
    amount: number;
    currency: string;
    qr_code_url: string;
    status: string;
  }>("/payments/promptpay", { invoice_id: invoiceId });
}

/**
 * ดึงสถานะการจ่ายเงินล่าสุดของใบแจ้งหนี้เพื่อตรวจสอบการสแกนจ่ายสำเร็จ
 */
export async function getPaymentStatus(invoiceId: number): Promise<{
  invoice_id: number;
  transaction_id?: string;
  status: string;
  method?: string;
  paid_at?: string;
}> {
  return httpClient.get<{
    invoice_id: number;
    transaction_id?: string;
    status: string;
    method?: string;
    paid_at?: string;
  }>(`/payments/status/${invoiceId}`);
}

/**
 * บันทึกประวัติการรับชำระค่าน้ำประปาและขยะด้วยเงินสด
 */
export async function createCashPayment(invoiceId: number): Promise<{
  invoice_id: number;
  amount: number;
  currency: string;
  status: string;
  paid_at: string;
  staff_id: number;
}> {
  return httpClient.post<{
    invoice_id: number;
    amount: number;
    currency: string;
    status: string;
    paid_at: string;
    staff_id: number;
  }>("/payments/cash", { invoice_id: invoiceId });
}

/**
 * ดึงข้อมูลใบเสร็จรับเงินอย่างเป็นทางการที่ผ่านการชำระเงินเรียบร้อยแล้ว
 */
export async function getReceipt(invoiceId: number): Promise<{
  receipt_number: string;
  receipt_date: string;
  paid_at: string;
  payment_method: string;
  total_amount: number;
  bill_month: string;
  organization: {
    name: string;
    address: string;
    phone_number?: string;
  };
  household: {
    water_user_id: string;
    owner_name: string;
    house_number: string;
    village_name: string;
    village_number: number;
    full_address: string;
  };
  water_usage?: {
    prev_reading_value: number;
    curr_reading_value: number;
    unit_consumed: number;
    water_bill_amount: number;
    start_date?: string;
    end_date?: string;
  };
  garbage_usage?: {
    total_amount: number;
    details: Array<{
      size_name: string;
      cost: number;
      amount: number;
    }>;
  };
  staff_name?: string;
}> {
  return httpClient.get(`/payments/receipt/${invoiceId}`);
}
