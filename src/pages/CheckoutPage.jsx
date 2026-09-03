import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import { getStripePromise } from "../stripe";
import PaymentMethodSelector from "../components/checkout/PaymentMethodSelector";
import styles from "./CheckoutPage.module.css";

const emptyAddress = {
  fullName: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
  phone: "",
};

const CheckoutPage = () => {
  const { items } = useCart();

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <Elements stripe={getStripePromise()}>
      <CheckoutForm />
    </Elements>
  );
};

const CheckoutForm = () => {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [address, setAddress] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setAddress((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const buildOrderItems = () =>
    items.map((item) => ({
      product: item.id,
      title: item.title,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      let stripePaymentIntentId;

      if (paymentMethod === "card") {
        if (!stripe || !elements) {
          throw new Error("Payment form is still loading — please try again");
        }

        const { clientSecret } = await paymentService.createIntent(subtotal);
        const cardElement = elements.getElement(CardElement);
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: address.fullName,
              phone: address.phone,
            },
          },
        });

        if (result.error) {
          throw new Error(result.error.message || "Card payment failed");
        }
        if (result.paymentIntent.status !== "succeeded") {
          throw new Error("Payment was not completed");
        }
        stripePaymentIntentId = result.paymentIntent.id;
      }

      const order = await orderService.createOrder({
        items: buildOrderItems(),
        shippingAddress: address,
        paymentMethod,
        stripePaymentIntentId,
      });
      clearCart();
      navigate("/orders", { state: { placedOrderId: order.id } });
    } catch (err) {
      setError(err.message || "Could not place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Checkout</h1>
      <p className={styles.subtitle}>Enter where you'd like this delivered</p>

      <div className={styles.layout}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <label className={styles.label} htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            className={styles.input}
            value={address.fullName}
            onChange={handleChange("fullName")}
            required
          />

          <label className={styles.label} htmlFor="line1">
            Address
          </label>
          <input
            id="line1"
            className={styles.input}
            value={address.line1}
            onChange={handleChange("line1")}
            placeholder="Street address"
            required
          />

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="city">
                City
              </label>
              <input
                id="city"
                className={styles.input}
                value={address.city}
                onChange={handleChange("city")}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="state">
                State
              </label>
              <input
                id="state"
                className={styles.input}
                value={address.state}
                onChange={handleChange("state")}
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="postalCode">
                Postal Code
              </label>
              <input
                id="postalCode"
                className={styles.input}
                value={address.postalCode}
                onChange={handleChange("postalCode")}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                className={styles.input}
                value={address.phone}
                onChange={handleChange("phone")}
                required
              />
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Payment Method</h2>
          <PaymentMethodSelector
            method={paymentMethod}
            onMethodChange={setPaymentMethod}
          />

          <button
            type="submit"
            className={styles.placeOrderButton}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Placing order..."
              : `Place Order — $${subtotal.toFixed(2)}`}
          </button>
        </form>

        <div className={styles.summary}>
          <h2 className={styles.summaryTitle}>Order Summary</h2>
          {items.map((item) => (
            <div key={item.id} className={styles.summaryItem}>
              <img
                src={item.image}
                alt={item.title}
                className={styles.summaryImage}
              />
              <div className={styles.summaryItemInfo}>
                <p className={styles.summaryItemTitle}>
                  {item.title.slice(0, 40)}
                  {item.title.length > 40 ? "…" : ""}
                </p>
                <p className={styles.summaryItemQty}>Qty {item.quantity}</p>
              </div>
              <p className={styles.summaryItemPrice}>
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
          <div className={styles.summaryDivider} />
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
