import React from "react";
import styles from "./OrderStatusStepper.module.css";

const STEPS = ["pending", "processing", "shipped", "delivered"];
const STEP_LABELS = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

// A compact progress stepper for the order lifecycle. Cancelled is not part
// of the forward flow (it's a terminal branch, not "the step after
// delivered"), so it gets its own badge + restore action instead of living
// in the same list as the other four statuses.
const OrderStatusStepper = ({ status, onChange }) => {
  if (status === "cancelled") {
    return (
      <div className={styles.cancelledRow}>
        <span className={styles.cancelledBadge}>✕ Cancelled</span>
        <button
          type="button"
          className={styles.restoreLink}
          onClick={() => onChange("pending")}
        >
          Restore
        </button>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status);

  const handleCancel = () => {
    if (window.confirm("Cancel this order? This can't be undone from here.")) {
      onChange("cancelled");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.stepper}>
        {STEPS.map((step, i) => {
          const state =
            i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
          return (
            <React.Fragment key={step}>
              {i > 0 && (
                <div
                  className={`${styles.connector} ${
                    i <= currentIndex ? styles.connectorDone : ""
                  }`}
                />
              )}
              <button
                type="button"
                title={STEP_LABELS[step]}
                aria-label={STEP_LABELS[step]}
                className={`${styles.dot} ${styles[state]}`}
                onClick={() => i !== currentIndex && onChange(step)}
              >
                {state === "done" ? "✓" : i + 1}
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <div className={styles.footer}>
        <span className={styles.statusText}>{STEP_LABELS[status]}</span>
        <button type="button" className={styles.cancelLink} onClick={handleCancel}>
          Cancel order
        </button>
      </div>
    </div>
  );
};

export default OrderStatusStepper;
