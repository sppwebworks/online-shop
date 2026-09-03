import { apiRequest } from "./httpClient";

export const paymentApi = {
  createIntent: (amount) =>
    apiRequest("/payments/create-intent", {
      method: "POST",
      body: { amount },
      auth: true,
    }),
};
