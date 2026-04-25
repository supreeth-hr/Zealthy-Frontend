import { request } from "../client";
import { Frequency } from "../types";

export const metadataApi = {
  getMedications() {
    return request<string[]>("/api/medications");
  },

  getDosages() {
    return request<string[]>("/api/dosages");
  },

  getFrequencies() {
    return request<Frequency[]>("/api/frequency");
  },
};
