import { request } from "../client";
import { Frequency } from "../types";

type AdminAppointmentPayload = { provider: string; datetime: string; repeat: Frequency };

export const adminAppointmentsApi = {
  listUpcomingAppointments(userId: number) {
    return request<Array<{ provider: string; datetime: string; repeat: Frequency }>>(
      `/api/admin/patients/${userId}/appointments/upcoming`
    );
  },

  listAllAppointments(userId: number) {
    return request<Array<{ id: number; user_id: number; provider: string; datetime: string; repeat: Frequency; created_at: string }>>(
      `/api/admin/patients/${userId}/allappointments`
    );
  },

  createAppointment(userId: number, input: AdminAppointmentPayload) {
    return request(`/api/admin/patients/${userId}/appointments`, { method: "POST", body: input });
  },

  updateAppointment(userId: number, appointmentId: number, input: AdminAppointmentPayload) {
    return request(`/api/admin/patients/${userId}/appointments/${appointmentId}`, { method: "PUT", body: input });
  },

  deleteAppointment(userId: number, appointmentId: number) {
    return request(`/api/admin/patients/${userId}/appointments/${appointmentId}`, { method: "DELETE" });
  },
};
