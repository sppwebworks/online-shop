import { orderApi } from "../api/orderApi";

export const orderService = {
  createOrder: (order) => orderApi.createOrder(order),
  getMyOrders: (signal) => orderApi.getMyOrders(signal),
  getAllOrders: (signal) => orderApi.getAllOrders(signal),
  updateOrderStatus: (id, status) => orderApi.updateOrderStatus(id, status),
  cancelOrder: (id) => orderApi.cancelOrder(id),
  requestReturn: (id, payload) => orderApi.requestReturn(id, payload),
  reviewReturn: (id, decision) => orderApi.reviewReturn(id, decision),
};
