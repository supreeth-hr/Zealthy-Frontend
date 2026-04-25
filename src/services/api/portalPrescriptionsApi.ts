import { request } from "../client";
import { Frequency } from "../types";

export const portalPrescriptionsApi = {
  getPortalPrescriptions(userId: number, token: string) {
    return request<Array<{ medication: string; dosage: string; quantity: number; refill_on: string; schedule: Frequency }>>(
      `/api/portal/prescriptions/${userId}`,
      { token }
    );
  },

  getPortalUniquePrescriptions(userId: number, token: string) {
    return request<Array<{ medication: string; dosage: string; quantity: number; refill_on: string; refill_schedule: Frequency }>>(
      `/api/portal/allprescriptions/${userId}`,
      { token }
    );
  },
};
