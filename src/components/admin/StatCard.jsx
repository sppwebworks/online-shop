import React from "react";
import styles from "./StatCard.module.css";

const StatCard = ({ icon, label, value, accent = "indigo" }) => (
  <div className={styles.card}>
    <div className={`${styles.icon} ${styles[accent] || ""}`}>{icon}</div>
    <div>
      <p className={styles.value}>{value}</p>
      <p className={styles.label}>{label}</p>
    </div>
  </div>
);

export default StatCard;
