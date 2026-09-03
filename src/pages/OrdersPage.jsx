import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { orderService } from "../services/orderService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import OrderActions from "../components/orders/OrderActions";
import styles from "./OrdersPage.module.css";

const statusLabels = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const paymentMethodLabels = {
  card: "Credit / Debit Card",
  upi: "UPI",
  netbanking: "Net Banking",
  wallet: "Wallet",
  cod: "Cash on Delivery",
};

const OrdersPage = () => {
  const location = useLocation();
  const placedOrderId = location.state?.placedOrderId;

  const {
    data: orders,
    loading,
    error,
    refetch,
  } = useFetch((signal) => orderService.getMyOrders(signal));

  if (loading) return <LoadingSpinner message="Loading your orders..." />;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Orders</h1>
      <p className={styles.subtitle}>Track and review your past purchases</p>

      {placedOrderId && (
        <div className={styles.confirmation}>
          ✓ Your order was placed successfully.
        </div>
      )}

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <p>You haven't placed any orders yet.</p>
          <Link to="/products" className={styles.browseLink}>
            Browse Products →
          </Link>
        </div>
      ) : (
        <div className={styles.orders}>
          {orders.map((order) => (
            <div key={order.id} className={styles.order}>
              <div className={styles.orderHeader}>
                <div>
                  <p className={styles.orderId}>Order #{order.id.slice(-8)}</p>
                  <p className={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`${styles.status} ${styles[`status_${order.status}`]}`}
                >
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div className={styles.orderItems}>
                {order.items.map((item, index) => (
                  <div key={index} className={styles.orderItem}>
                    <img
                      src={item.image}
                      alt={item.title}
                      className={styles.orderItemImage}
                    />
                    <div className={styles.orderItemInfo}>
                      <p className={styles.orderItemTitle}>{item.title}</p>
                      <p className={styles.orderItemMeta}>
                        {[item.size, item.color].filter(Boolean).join(" · ")}
                        {(item.size || item.color) && " · "}
                        Qty {item.quantity} · ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.orderFooter}>
                <div className={styles.orderFooterLeft}>
                  <span>Shipping to {order.shippingAddress.fullName}</span>
                  <span className={styles.paymentInfo}>
                    {paymentMethodLabels[order.paymentMethod] ||
                      order.paymentMethod}{" "}
                    ·{" "}
                    <span
                      className={
                        order.paymentStatus === "paid"
                          ? styles.paidBadge
                          : styles.paymentPendingBadge
                      }
                    >
                      {order.paymentStatus === "paid" ? "Paid" : "Pay on delivery"}
                    </span>
                  </span>
                </div>
                <span className={styles.orderTotal}>
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>

              <OrderActions order={order} onChanged={refetch} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
