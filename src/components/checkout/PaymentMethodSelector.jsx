import React, { useState } from "react";
import { CardElement } from "@stripe/react-stripe-js";
import { useTheme } from "../../context/ThemeContext";
import styles from "./PaymentMethodSelector.module.css";

const METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: "💳" },
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "netbanking", label: "Net Banking", icon: "🏦" },
  { id: "wallet", label: "Wallet", icon: "👛" },
  { id: "cod", label: "Cash on Delivery", icon: "💵" },
];

const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"];
const WALLETS = ["Paytm", "PhonePe", "Amazon Pay", "Google Pay"];

const CARD_ELEMENT_COLORS = {
  light: { text: "#0f172a", muted: "#94a3b8", border: "#e6e9ec" },
  dark: { text: "#f1f5f4", muted: "#64748b", border: "#1f2b26" },
};

// The UPI/bank/wallet sub-fields below are for checkout realism only —
// there's no gateway wired up for those methods, so none of those values
// ever leave this component. Card payments are real: the CardElement below
// is a Stripe-hosted iframe, so raw card details never touch our app code
// or backend — only a Stripe-issued token does.
const PaymentMethodSelector = ({ method, onMethodChange }) => {
  const { isDark } = useTheme();
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [wallet, setWallet] = useState(WALLETS[0]);

  const colors = isDark ? CARD_ELEMENT_COLORS.dark : CARD_ELEMENT_COLORS.light;
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        fontFamily: "inherit",
        color: colors.text,
        "::placeholder": { color: colors.muted },
      },
      invalid: { color: "#e11d48" },
    },
  };

  return (
    <div className={styles.container}>
      <div className={styles.methodGrid}>
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`${styles.methodCard} ${method === m.id ? styles.selected : ""}`}
            onClick={() => onMethodChange(m.id)}
          >
            <span className={styles.methodIcon}>{m.icon}</span>
            <span className={styles.methodLabel}>{m.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.details}>
        {method === "card" && (
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="cardElement">
              Card Details
            </label>
            <div className={styles.cardElementBox}>
              <CardElement id="cardElement" options={cardElementOptions} />
            </div>
            <p className={styles.hint}>
              🔒 Secured by Stripe — your card details go straight to Stripe
              and never touch our server.
            </p>
          </div>
        )}

        {method === "upi" && (
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="upiId">
              UPI ID
            </label>
            <input
              id="upiId"
              className={styles.input}
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@bank"
              required
            />
            <p className={styles.hint}>
              🔒 Demo checkout — no real payment request is sent.
            </p>
          </div>
        )}

        {method === "netbanking" && (
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="bank">
              Select Bank
            </label>
            <select
              id="bank"
              className={styles.input}
              value={bank}
              onChange={(e) => setBank(e.target.value)}
            >
              {BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <p className={styles.hint}>
              🔒 Demo checkout — you won't be redirected to your bank.
            </p>
          </div>
        )}

        {method === "wallet" && (
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="wallet">
              Select Wallet
            </label>
            <select
              id="wallet"
              className={styles.input}
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            >
              {WALLETS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
            <p className={styles.hint}>
              🔒 Demo checkout — no real wallet balance is used.
            </p>
          </div>
        )}

        {method === "cod" && (
          <div className={styles.codNote}>
            💵 Pay with cash when your order arrives.
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
