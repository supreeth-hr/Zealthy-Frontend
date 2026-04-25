import { request } from "../client";
import { Frequency } from "../types";

export const portalAppointmentsApi = {
  getPortalAppointments(userId: number, token: string) {
    return request<Array<{ provider: string; datetime: string; repeat: Frequency }>>(`/api/portal/appointments/${userId}`, {
      token,
    });
  },

  getPortalUniqueAppointments(userId: number, token: string) {
    return request<Array<{ provider: string; datetime: string; repeat: Frequency }>>(`/api/portal/allappointments/${userId}`, {
      token,
    });
  },
};
