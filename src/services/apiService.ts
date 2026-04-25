import { adminAppointmentsApi } from "./api/adminAppointmentsApi";
import { adminPatientsApi } from "./api/adminPatientsApi";
import { adminPrescriptionsApi } from "./api/adminPrescriptionsApi";
import { authApi } from "./api/authApi";
import { metadataApi } from "./api/metadataApi";
import { portalAppointmentsApi } from "./api/portalAppointmentsApi";
import { portalPrescriptionsApi } from "./api/portalPrescriptionsApi";

export const apiService = {
  ...authApi,
  ...adminPatientsApi,
  ...adminAppointmentsApi,
  ...adminPrescriptionsApi,
  ...metadataApi,
  ...portalAppointmentsApi,
  ...portalPrescriptionsApi,
};
