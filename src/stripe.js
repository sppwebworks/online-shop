import { loadStripe } from "@stripe/stripe-js";

let stripePromise = null;

// Lazy on purpose: calling loadStripe() is what actually injects Stripe's
// script + iframes into the page, so this must not run at module-import
// time. CheckoutPage is statically imported from App.js, so an eager
// stripePromise here would load Stripe.js on every route, not just
// checkout. getStripePromise() defers that until the checkout page (the
// only caller) actually mounts.
export const getStripePromise = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "");
  }
  return stripePromise;
};
