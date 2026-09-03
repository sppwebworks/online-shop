import { apiRequest } from "./httpClient";

export const categoryApi = {
  getAllCategories: (signal) => apiRequest("/categories", { signal }),

  createCategory: (category) =>
    apiRequest("/categories", { method: "POST", body: category, auth: true }),

  updateCategory: (id, updates) =>
    apiRequest(`/categories/${id}`, {
      method: "PUT",
      body: updates,
      auth: true,
    }),

  deleteCategory: (id) =>
    apiRequest(`/categories/${id}`, { method: "DELETE", auth: true }),
};
