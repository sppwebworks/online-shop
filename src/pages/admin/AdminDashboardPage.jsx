import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { productService } from "../../services/productService";
import { orderService } from "../../services/orderService";
import { userService } from "../../services/userService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatCard from "../../components/admin/StatCard";
import styles from "./AdminDashboardPage.module.css";

const statusStyles = {
  pending: "statusPending",
  processing: "statusProcessing",
  shipped: "statusShipped",
  delivered: "statusDelivered",
  cancelled: "statusCancelled",
};

const STATUS_FLOW = ["pending", "processing", "shipped", "delivered", "cancelled"];

const QUICK_ACTIONS = [
  { to: "/admin/products/new", icon: "➕", label: "Add Product" },
  { to: "/admin/orders", icon: "🧾", label: "Manage Orders" },
  { to: "/admin/categories", icon: "🏷️", label: "Manage Categories" },
  { to: "/admin/users", icon: "👥", label: "Manage Users" },
];

const AdminDashboardPage = () => {
  const { user } = useAdminAuth();

  const {
    data: products,
    loading: productsLoading,
    error: productsError,
  } = useFetch((signal) => productService.getAllProducts(signal));

  const {
    data: orders,
    loading: ordersLoading,
    error: ordersError,
  } = useFetch((signal) => orderService.getAllOrders(signal));

  const {
    data: users,
    loading: usersLoading,
    error: usersError,
  } = useFetch((signal) => userService.getAllUsers(signal));

  const catalogStats = useMemo(() => {
    if (!products || products.length === 0) {
      return { total: 0, categories: 0, totalValue: 0 };
    }
    const categories = new Set(products.map((p) => p.category));
    const totalValue = products.reduce((sum, p) => sum + p.price, 0);
    return { total: products.length, categories: categories.size, totalValue };
  }, [products]);

  const orderStats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return { total: 0, pending: 0, revenue: 0, byStatus: {} };
    }
    const pending = orders.filter((o) => o.status === "pending").length;
    const revenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const byStatus = STATUS_FLOW.reduce((acc, status) => {
      acc[status] = orders.filter((o) => o.status === status).length;
      return acc;
    }, {});
    return { total: orders.length, pending, revenue, byStatus };
  }, [orders]);

  const customerCount = useMemo(
    () => (users || []).filter((u) => u.role === "customer").length,
    [users],
  );

  const inventoryAlerts = useMemo(() => {
    if (!products) return [];
    const alerts = [];
    products.forEach((product) => {
      (product.variants || []).forEach((variant) => {
        if (variant.stock <= 5) {
          alerts.push({
            productId: product.id,
            title: product.title,
            variantLabel: [variant.size, variant.color].filter(Boolean).join(" / "),
            stock: variant.stock,
          });
        }
      });
    });
    // Out of stock first, then lowest stock first
    return alerts.sort((a, b) => a.stock - b.stock).slice(0, 6);
  }, [products]);

  const recentOrders = useMemo(() => (orders || []).slice(0, 5), [orders]);

  const loading = productsLoading || ordersLoading || usersLoading;
  const error = productsError || ordersError || usersError;

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  const greetingName = user?.name?.split(" ")[0] || "there";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div className={styles.banner}>
        <div>
          <h1 className={styles.title}>Welcome back, {greetingName} 👋</h1>
          <p className={styles.subtitle}>{today}</p>
        </div>
      </div>

      <div className={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.to} to={action.to} className={styles.quickAction}>
            <span className={styles.quickActionIcon}>{action.icon}</span>
            <span>{action.label}</span>
          </Link>
        ))}
      </div>

      <h2 className={styles.sectionLabel}>Sales</h2>
      <div className={styles.grid}>
        <StatCard
          icon="🧾"
          label="Total Orders"
          value={orderStats.total}
          accent="indigo"
        />
        <StatCard
          icon="⏳"
          label="Pending Orders"
          value={orderStats.pending}
          accent="amber"
        />
        <StatCard
          icon="💵"
          label="Revenue"
          value={`$${orderStats.revenue.toFixed(2)}`}
          accent="green"
        />
        <StatCard
          icon="👥"
          label="Customers"
          value={customerCount}
          accent="purple"
        />
      </div>

      <h2 className={styles.sectionLabel}>Catalog</h2>
      <div className={styles.grid}>
        <StatCard
          icon="📦"
          label="Total Products"
          value={catalogStats.total}
          accent="indigo"
        />
        <StatCard
          icon="🏷️"
          label="Categories"
          value={catalogStats.categories}
          accent="purple"
        />
        <StatCard
          icon="💰"
          label="Inventory Value"
          value={`$${catalogStats.totalValue.toFixed(2)}`}
          accent="green"
        />
      </div>

      <div className={styles.splitRow}>
        <div className={styles.panel}>
          <h2 className={styles.sectionLabel}>Order Status Breakdown</h2>
          {orderStats.total === 0 ? (
            <div className={styles.noResults}>No orders yet</div>
          ) : (
            <div className={styles.statusBreakdown}>
              {STATUS_FLOW.map((status) => {
                const count = orderStats.byStatus[status] || 0;
                const pct = orderStats.total > 0 ? (count / orderStats.total) * 100 : 0;
                return (
                  <div key={status} className={styles.breakdownRow}>
                    <span className={styles.breakdownLabel}>{status}</span>
                    <div className={styles.breakdownTrack}>
                      <div
                        className={`${styles.breakdownFill} ${styles[statusStyles[status]]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={styles.breakdownCount}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <h2 className={styles.sectionLabel}>Inventory Alerts</h2>
          {inventoryAlerts.length === 0 ? (
            <div className={styles.noResults}>All variants are well stocked</div>
          ) : (
            <div className={styles.alertsList}>
              {inventoryAlerts.map((alert, i) => (
                <Link
                  key={i}
                  to={`/admin/products/${alert.productId}/edit`}
                  className={styles.alertRow}
                >
                  <div>
                    <p className={styles.alertTitle}>{alert.title}</p>
                    {alert.variantLabel && (
                      <p className={styles.alertVariant}>{alert.variantLabel}</p>
                    )}
                  </div>
                  <span
                    className={`${styles.alertBadge} ${
                      alert.stock === 0 ? styles.alertBadgeOut : styles.alertBadgeLow
                    }`}
                  >
                    {alert.stock === 0 ? "Out of stock" : `${alert.stock} left`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionLabel}>Recent Orders</h2>
        <Link to="/admin/orders" className={styles.viewAllLink}>
          View all →
        </Link>
      </div>

      {recentOrders.length === 0 ? (
        <div className={styles.noResults}>No orders yet</div>
      ) : (
        <div className={styles.recentWrapper}>
          <table className={styles.recentTable}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.orderId}>#{order.id.slice(-8)}</td>
                  <td>{order.user?.name || "—"}</td>
                  <td className={styles.orderTotal}>${order.totalAmount.toFixed(2)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[statusStyles[order.status]] || ""
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
