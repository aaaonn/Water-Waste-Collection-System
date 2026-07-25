export interface Household {
  id: number;
  village_id: number;
  house_number: string;
  house_code: string;
  title_name: string;
  first_name: string;
  last_name: string;
  citizen_id: string;
  phone_number: string;
  water_user_id: string;
  water_status: string;
  garbage_status: string;
  is_water_recorded: boolean;
  is_garbage_recorded: boolean;
  prev_reading?: number;
  garbage_size_id?: number;
  username?: string;
  password?: string;
}

export interface CreateHouseholdRequest {
  village_id: number;
  house_number: string;
  house_code: string;
  title_name: string;
  first_name: string;
  last_name: string;
  citizen_id: string;
  phone_number: string;
  water_user_id: string;
  prev_reading: number;
  staff_id: number;
  water_status: string;
  garbage_status: string;
  garbage_size_id?: number;
  username?: string;
  password?: string;
}

export interface UpdateHouseholdRequest {
  village_id?: number;
  house_number?: string;
  house_code?: string;
  title_name?: string;
  first_name?: string;
  last_name?: string;
  citizen_id?: string;
  phone_number?: string;
  water_user_id?: string;
  water_status?: string;
  garbage_status?: string;
  prev_reading?: number;
  garbage_size_id?: number;
  username?: string;
  password?: string;
}

export interface VillageResponse {
  id: number;
  village_name: string;
  village_number: number;
  subdistrict_id: number;
  subdistrict_name?: string;
  title_name: string;
  headman_firstname: string;
  headman_lastname: string;
  number_house: number;
  headman_phone_number: string;
}

export interface GarbageRateResponse {
  id: number;
  subdistrict_id: number;
  size_name: string;
  cost: number;
}
