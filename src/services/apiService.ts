import { Frequency, SessionState, SessionUser } from "./types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorBody = (await response.json()) as { error?: string };
      if (errorBody?.error) errorMessage = errorBody.error;
    } catch {
      // noop
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

type AdminAppointmentPayload = { provider: string; datetime: string; repeat: Frequency };
type AdminPrescriptionPayload = {
  medication: string;
  dosage: string;
  quantity: number;
  refill_on: string;
  refill_schedule: Frequency;
};

export const apiService = {
  async login(email: string, password: string): Promise<SessionState> {
    return request<SessionState>("/api/login", { method: "POST", body: { email, password } });
  },

  async listPatients(): Promise<SessionUser[]> {
    return request<SessionUser[]>("/api/admin/patients");
  },

  async createPatient(input: { name: string; email: string; password: string }) {
    return request<SessionUser>("/api/admin/patients", { method: "POST", body: input });
  },

  async updatePatient(userId: number, input: { name: string; email: string }) {
    return request<SessionUser>(`/api/admin/patients/${userId}`, { method: "PUT", body: input });
  },

  async updatePatientPassword(userId: number, input: { password: string }) {
    return request<SessionUser>(`/api/admin/patients/${userId}/password`, { method: "PUT", body: input });
  },

  async listUpcomingAppointments(userId: number) {
    return request<Array<{ provider: string; datetime: string; repeat: Frequency }>>(
      `/api/admin/patients/${userId}/appointments/upcoming`
    );
  },

  async listAllAppointments(userId: number) {
    return request<Array<{ id: number; user_id: number; provider: string; datetime: string; repeat: Frequency; created_at: string }>>(
      `/api/admin/patients/${userId}/allappointments`
    );
  },

  async createAppointment(userId: number, input: AdminAppointmentPayload) {
    return request(`/api/admin/patients/${userId}/appointments`, { method: "POST", body: input });
  },

  async updateAppointment(userId: number, appointmentId: number, input: AdminAppointmentPayload) {
    return request(`/api/admin/patients/${userId}/appointments/${appointmentId}`, { method: "PUT", body: input });
  },

  async deleteAppointment(userId: number, appointmentId: number) {
    return request(`/api/admin/patients/${userId}/appointments/${appointmentId}`, { method: "DELETE" });
  },

  async listUpcomingPrescriptions(userId: number) {
    return request<Array<{ medication: string; dosage: string; quantity: number; refill_on: string; schedule: Frequency }>>(
      `/api/admin/patients/${userId}/prescriptions/upcoming`
    );
  },

  async listAllPrescriptions(userId: number) {
    return request<
      Array<{
        id: number;
        user_id: number;
        medication: string;
        dosage: string;
        quantity: number;
        refill_on: string;
        refill_schedule: Frequency;
        created_at: string;
      }>
    >(`/api/admin/patients/${userId}/allprescriptions`);
  },

  async createPrescription(userId: number, input: AdminPrescriptionPayload) {
    return request(`/api/admin/patients/${userId}/prescriptions`, { method: "POST", body: input });
  },

  async updatePrescription(userId: number, prescriptionId: number, input: AdminPrescriptionPayload) {
    return request(`/api/admin/patients/${userId}/prescriptions/${prescriptionId}`, { method: "PUT", body: input });
  },

  async deletePrescription(userId: number, prescriptionId: number) {
    return request(`/api/admin/patients/${userId}/prescriptions/${prescriptionId}`, { method: "DELETE" });
  },

  async getMedications() {
    return request<string[]>("/api/medications");
  },

  async getDosages() {
    return request<string[]>("/api/dosages");
  },

  async getFrequencies() {
    return request<Frequency[]>("/api/frequency");
  },

  async getPortalAppointments(userId: number, token: string) {
    return request<Array<{ provider: string; datetime: string; repeat: Frequency }>>(`/api/portal/appointments/${userId}`, {
      token,
    });
  },

  async getPortalUniqueAppointments(userId: number, token: string) {
    return request<Array<{ provider: string; datetime: string; repeat: Frequency }>>(`/api/portal/allappointments/${userId}`, {
      token,
    });
  },

  async getPortalPrescriptions(userId: number, token: string) {
    return request<Array<{ medication: string; dosage: string; quantity: number; refill_on: string; schedule: Frequency }>>(
      `/api/portal/prescriptions/${userId}`,
      { token }
    );
  },

  async getPortalUniquePrescriptions(userId: number, token: string) {
    return request<Array<{ medication: string; dosage: string; quantity: number; refill_on: string; refill_schedule: Frequency }>>(
      `/api/portal/allprescriptions/${userId}`,
      { token }
    );
  },
};
