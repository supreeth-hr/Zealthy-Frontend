import { Frequency } from "../types";

export type AppointmentListItem = { provider: string; datetime: string; repeat: Frequency };

export type AdminAppointmentRow = {
  id: number;
  user_id: number;
  provider: string;
  datetime: string;
  repeat: Frequency;
  created_at: string;
};

export type PrescriptionTimelineItem = {
  medication: string;
  dosage: string;
  quantity: number;
  refill_on: string;
  schedule: Frequency;
};

export type PrescriptionRow = {
  id: number;
  user_id: number;
  medication: string;
  dosage: string;
  quantity: number;
  refill_on: string;
  refill_schedule: Frequency;
  created_at: string;
};

export type PortalPrescriptionRow = {
  medication: string;
  dosage: string;
  quantity: number;
  refill_on: string;
  refill_schedule: Frequency;
};
