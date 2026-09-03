import { apiRequest } from "./httpClient";

export const userApi = {
  getAllUsers: (signal) => apiRequest("/users", { signal, auth: true }),

  createUser: (user) =>
    apiRequest("/users", { method: "POST", body: user, auth: true }),

  updateUserRole: (id, role) =>
    apiRequest(`/users/${id}/role`, {
      method: "PUT",
      body: { role },
      auth: true,
    }),

  deleteUser: (id) =>
    apiRequest(`/users/${id}`, { method: "DELETE", auth: true }),
};
