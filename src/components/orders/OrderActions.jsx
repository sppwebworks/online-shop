import React, { useState } from "react";
import { orderService } from "../../services/orderService";
import styles from "./OrderActions.module.css";

const RETURN_WINDOW_DAYS = 7;
const CANCELLABLE_STATUSES = ["pending", "processing"];

const returnStatusLabels = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
};

// Customer-facing cancel / return / exchange actions for a single order.
// Mirrors the backend's rules so the UI never offers an action the server
// would reject: cancellable while it hasn't shipped yet, returnable /
// exchangeable for RETURN_WINDOW_DAYS after delivery.
const OrderActions = ({ order, onChanged }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [returnForm, setReturnForm] = useState(null); // "return" | "exchange" | null
  const [reason, setReason] = useState("");

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setError("");
    setIsSubmitting(true);
    try {
      await orderService.cancelOrder(order.id);
      onChanged();
    } catch (err) {
      setError(err.message || "Could not cancel order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await orderService.requestReturn(order.id, { type: returnForm, reason });
      setReturnForm(null);
      setReason("");
      onChanged();
    } catch (err) {
      setError(err.message || "Could not submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (order.returnStatus && order.returnStatus !== "none") {
    return (
      <div className={styles.container}>
        <span className={`${styles.returnBadge} ${styles[`return_${order.returnStatus}`]}`}>
          {order.returnType === "exchange" ? "Exchange" : "Return"}{" "}
          {returnStatusLabels[order.returnStatus] || order.returnStatus}
        </span>
      </div>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  const daysSinceDelivery = order.deliveredAt
    ? (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
    : null;
  const canReturn =
    order.status === "delivered" &&
    daysSinceDelivery !== null &&
    daysSinceDelivery <= RETURN_WINDOW_DAYS;
  const returnWindowExpired =
    order.status === "delivered" && daysSinceDelivery !== null && daysSinceDelivery > RETURN_WINDOW_DAYS;

  if (!canCancel && !canReturn && !returnWindowExpired) {
    return null;
  }

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}

      {returnForm ? (
        <form className={styles.returnForm} onSubmit={handleSubmitReturn}>
          <label className={styles.label} htmlFor="reason">
            Why do you want to {returnForm} this order? (optional)
          </label>
          <textarea
            id="reason"
            className={styles.textarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <div className={styles.formButtons}>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => {
                setReturnForm(null);
                setReason("");
              }}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : `Submit ${returnForm} request`}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.buttonRow}>
          {canCancel && (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel Order
            </button>
          )}
          {canReturn && (
            <>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => setReturnForm("return")}
              >
                Return
              </button>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => setReturnForm("exchange")}
              >
                Exchange
              </button>
            </>
          )}
          {returnWindowExpired && (
            <span className={styles.expiredNote}>
              Return window ({RETURN_WINDOW_DAYS} days after delivery) has passed
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderActions;
