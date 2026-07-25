import { httpClient } from "./http-client";
import { 
  Household, 
  CreateHouseholdRequest, 
  UpdateHouseholdRequest, 
  VillageResponse, 
  GarbageRateResponse 
} from "../interface/household";

/**
 * ดึงข้อมูลครัวเรือนทั้งหมด
 */
export async function getHouseholds(): Promise<Household[]> {
  return httpClient.get<Household[]>("/households");
}

/**
 * ดึงข้อมูลครัวเรือนแยกตามหมู่บ้าน
 */
export async function getHouseholdsByVillage(villageId: number): Promise<Household[]> {
  return httpClient.get<Household[]>(`/villages/${villageId}/households`);
}

/**
 * ดึงข้อมูลครัวเรือนตาม ID
 */
export async function getHouseholdById(id: number): Promise<Household> {
  return httpClient.get<Household>(`/households/${id}`);
}

/**
 * ดึงข้อมูลครัวเรือนของตัวเอง (ดึงตาม Token)
 */
export async function getHouseholdMe(): Promise<Household> {
  return httpClient.get<Household>("/households/me");
}

/**
 * สร้างข้อมูลครัวเรือนใหม่
 */
export async function createHousehold(data: CreateHouseholdRequest): Promise<Household> {
  return httpClient.post<Household>("/households", data);
}

/**
 * อัปเดตข้อมูลครัวเรือนเดิม
 */
export async function updateHousehold(id: number, data: UpdateHouseholdRequest): Promise<Household> {
  return httpClient.patch<Household>(`/households/${id}`, data);
}

/**
 * ลบข้อมูลครัวเรือน
 */
export async function deleteHousehold(id: number): Promise<void> {
  return httpClient.delete(`/households/${id}`);
}

/**
 * ดึงข้อมูลหมู่บ้านทั้งหมดสำหรับตัวเลือก (Dropdown)
 */
export async function getVillages(): Promise<VillageResponse[]> {
  return httpClient.get<VillageResponse[]>("/villages");
}

/**
 * ดึงข้อมูลอัตราค่าบริการถังขยะสำหรับตัวเลือก (Dropdown)
 */
export async function getGarbageRates(subdistrictId: number = 1): Promise<GarbageRateResponse[]> {
  return httpClient.get<GarbageRateResponse[]>(`/garbage-rates?subdistrict_id=${subdistrictId}`);
}

export interface UpdateHouseholdProfilePayload {
  phone_number?: string;
  old_password?: string;
  new_password?: string;
}

/**
 * อัปเดตข้อมูลโปรไฟล์ผู้ใช้งานของ Household (เช่น เบอร์โทร, รหัสผ่าน)
 */
export async function updateHouseholdProfile(householdId: number, data: UpdateHouseholdProfilePayload): Promise<{ message: string }> {
  return httpClient.patch<{ message: string }>(`/household-profile/${householdId}`, data);
}
