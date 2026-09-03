import { apiRequest } from "./httpClient";

export const reviewApi = {
  getProductReviews: (productId, signal) =>
    apiRequest(`/products/${productId}/reviews`, { signal }),

  submitReview: (productId, { rating, comment, fit, images }) =>
    apiRequest(`/products/${productId}/reviews`, {
      method: "POST",
      body: { rating, comment, fit, images },
      auth: true,
    }),

  deleteMyReview: (productId) =>
    apiRequest(`/products/${productId}/reviews/me`, {
      method: "DELETE",
      auth: true,
    }),
};
