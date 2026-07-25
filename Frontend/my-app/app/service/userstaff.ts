import { httpClient } from "./http-client";

export interface UserstaffResponse {
  id: number;
  user_id: number;
  username: string;
  role: "admin" | "staff" | "field_staff" | "super_admin" | "household";
  status: "active" | "inactive";
  title_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface CreateUserstaffRequest {
  username: string;
  password?: string;
  role: string;
  status?: string;
  title_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface UpdateUserstaffRequest {
  password?: string;
  role?: string;
  status?: string;
  title_name?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

const getHeaders = (role: string) => ({
  headers: {
    "X-Requester-Role": role
  }
});

export async function getUserstaffs(): Promise<UserstaffResponse[]> {
  return httpClient.get<UserstaffResponse[]>("/userstaffs");
}

export async function getUserstaffById(id: number): Promise<UserstaffResponse> {
  return httpClient.get<UserstaffResponse>(`/userstaffs/${id}`);
}

export async function createUserstaff(data: CreateUserstaffRequest, requesterRole: string = "admin"): Promise<UserstaffResponse> {
  return httpClient.post<UserstaffResponse>("/userstaffs", data, getHeaders(requesterRole));
}

export async function updateUserstaff(id: number, data: UpdateUserstaffRequest, requesterRole: string = "admin"): Promise<UserstaffResponse> {
  return httpClient.patch<UserstaffResponse>(`/userstaffs/${id}`, data, getHeaders(requesterRole));
}

export async function deleteUserstaff(id: number, requesterRole: string = "admin"): Promise<void> {
  return httpClient.delete(`/userstaffs/${id}`, getHeaders(requesterRole));
}
