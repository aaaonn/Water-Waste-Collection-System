import { httpClient } from "./http-client";
import { InvoiceResponse } from "../interface/invoice";

export async function getInvoicesByHousehold(householdId: number, status?: string): Promise<{ data: InvoiceResponse[] }> {
  const query = status ? `?status=${status}` : "";
  return httpClient.get<{ data: InvoiceResponse[] }>(`/households/${householdId}/invoices${query}`);
}
