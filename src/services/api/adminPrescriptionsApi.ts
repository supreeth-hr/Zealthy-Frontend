import { request } from "../client";
import { Frequency } from "../types";

type AdminPrescriptionPayload = {
  medication: string;
  dosage: string;
  quantity: number;
  refill_on: string;
  refill_schedule: Frequency;
};

export const adminPrescriptionsApi = {
  listUpcomingPrescriptions(userId: number) {
    return request<Array<{ medication: string; dosage: string; quantity: number; refill_on: string; schedule: Frequency }>>(
      `/api/admin/patients/${userId}/prescriptions/upcoming`
    );
  },

  listAllPrescriptions(userId: number) {
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

  createPrescription(userId: number, input: AdminPrescriptionPayload) {
    return request(`/api/admin/patients/${userId}/prescriptions`, { method: "POST", body: input });
  },

  updatePrescription(userId: number, prescriptionId: number, input: AdminPrescriptionPayload) {
    return request(`/api/admin/patients/${userId}/prescriptions/${prescriptionId}`, { method: "PUT", body: input });
  },

  deletePrescription(userId: number, prescriptionId: number) {
    return request(`/api/admin/patients/${userId}/prescriptions/${prescriptionId}`, { method: "DELETE" });
  },
};
