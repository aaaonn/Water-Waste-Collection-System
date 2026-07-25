export interface OrganizationResponse {
  subdistrict_id: number;
  organization_full_name: string;
  district_name: string;
  province_name: string;
  title_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address_number: string;
  village_id: number;
  village_number: number;
  village_name: string;
}

export interface UpdateOrganizationRequest {
  title_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address_number: string;
  village_id: number;
  subdistrict_name: string;
  district_name: string;
  province_name: string;
}
