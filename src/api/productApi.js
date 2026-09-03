import { apiRequest } from "./httpClient";

export const productApi = {
  getAllProducts: (signal) => apiRequest("/products", { signal }),

  getVisibleProducts: (signal) =>
    apiRequest("/products?visibleOnly=true", { signal }),

  getProductsByCategory: (category, signal) =>
    apiRequest(`/products?category=${encodeURIComponent(category)}`, {
      signal,
    }),

  getProductById: (id, signal) => apiRequest(`/products/${id}`, { signal }),

  createProduct: (product) =>
    apiRequest("/products", { method: "POST", body: product, auth: true }),

  updateProduct: (id, product) =>
    apiRequest(`/products/${id}`, {
      method: "PUT",
      body: product,
      auth: true,
    }),

  deleteProduct: (id) =>
    apiRequest(`/products/${id}`, { method: "DELETE", auth: true }),
};
