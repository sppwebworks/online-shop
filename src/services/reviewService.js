import { reviewApi } from "../api/reviewApi";

export const reviewService = {
  getProductReviews: (productId, signal) => reviewApi.getProductReviews(productId, signal),
  submitReview: (productId, payload) => reviewApi.submitReview(productId, payload),
  deleteMyReview: (productId) => reviewApi.deleteMyReview(productId),
};
