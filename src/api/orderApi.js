import { apiRequest } from "./httpClient";

export const orderApi = {
  createOrder: (order) =>
    apiRequest("/orders", { method: "POST", body: order, auth: true }),

  getMyOrders: (signal) =>
    apiRequest("/orders/my", { signal, auth: true }),

  getAllOrders: (signal) =>
    apiRequest("/orders", { signal, auth: true }),

  updateOrderStatus: (id, status) =>
    apiRequest(`/orders/${id}/status`, {
      method: "PUT",
      body: { status },
      auth: true,
    }),

  cancelOrder: (id) =>
    apiRequest(`/orders/${id}/cancel`, { method: "POST", auth: true }),

  requestReturn: (id, { type, reason }) =>
    apiRequest(`/orders/${id}/return`, {
      method: "POST",
      body: { type, reason },
      auth: true,
    }),

  reviewReturn: (id, decision) =>
    apiRequest(`/orders/${id}/return`, {
      method: "PUT",
      body: { decision },
      auth: true,
    }),
};
