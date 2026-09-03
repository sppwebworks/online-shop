import { apiRequest } from "./httpClient";

export const authApi = {
  register: (payload) =>
    apiRequest("/auth/register", { method: "POST", body: payload }),

  login: (payload) =>
    apiRequest("/auth/login", { method: "POST", body: payload }),

  me: (signal) => apiRequest("/auth/me", { signal, auth: true }),

  forgotPassword: (email) =>
    apiRequest("/auth/forgot-password", { method: "POST", body: { email } }),

  resetPassword: (token, password) =>
    apiRequest(`/auth/reset-password/${token}`, {
      method: "POST",
      body: { password },
    }),
};
