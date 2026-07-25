import { httpClient } from "./http-client";
import { OrganizationResponse, UpdateOrganizationRequest } from "../interface/organization";

export const organizationService = {
  getOrganization: () => {
    return httpClient.get<{ data: OrganizationResponse }>("/organization");
  },
  
  updateOrganization: (data: UpdateOrganizationRequest) => {
    return httpClient.patch<{ message: string }>("/organization", data);
  },
};
