export type Frequency = "daily" | "weekly" | "monthly" | "yearly" | "none";

export type Patient = {
  id: number;
  name: string;
  email: string;
  password: string;
};

export type Appointment = {
  id: number;
  userId: number;
  provider: string;
  datetime: string;
  repeat: Frequency;
};

export type Prescription = {
  id: number;
  userId: number;
  medication: string;
  dosage: string;
  quantity: number;
  refillOn: string;
  refillSchedule: Frequency;
};

export type SessionUser = Omit<Patient, "password">;

export type SessionState = {
  token: string;
  user: SessionUser;
};
