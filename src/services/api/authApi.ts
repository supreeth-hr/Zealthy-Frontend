import { request } from "../client";
import { SessionState } from "../types";

export const authApi = {
  login(email: string, password: string): Promise<SessionState> {
    return request<SessionState>("/api/login", { method: "POST", body: { email, password } });
  },
};
