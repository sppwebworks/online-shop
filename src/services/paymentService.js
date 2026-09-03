import { paymentApi } from "../api/paymentApi";

export const paymentService = {
  createIntent: (amount) => paymentApi.createIntent(amount),
};
