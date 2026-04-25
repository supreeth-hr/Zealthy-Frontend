import { request } from "../client";
import { SessionUser } from "../types";

export const adminPatientsApi = {
  listPatients(): Promise<SessionUser[]> {
    return request<SessionUser[]>("/api/admin/patients");
  },

  createPatient(input: { name: string; email: string; password: string }) {
    return request<SessionUser>("/api/admin/patients", { method: "POST", body: input });
  },

  updatePatient(userId: number, input: { name: string; email: string }) {
    return request<SessionUser>(`/api/admin/patients/${userId}`, { method: "PUT", body: input });
  },

  updatePatientPassword(userId: number, input: { password: string }) {
    return request<SessionUser>(`/api/admin/patients/${userId}/password`, { method: "PUT", body: input });
  },
};
