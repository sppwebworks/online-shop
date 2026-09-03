import React, { useMemo, useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { usePagination } from "../../hooks/usePagination";
import { orderService } from "../../services/orderService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import OrderStatusStepper from "../../components/admin/OrderStatusStepper";
import StatCard from "../../components/admin/StatCard";
import Pagination from "../../components/admin/Pagination";
import styles from "./AdminOrdersPage.module.css";

const PAGE_SIZE = 8;

const paymentMethodLabels = {
  card: "Card",
  upi: "UPI",
  netbanking: "Net Banking",
  wallet: "Wallet",
  cod: "COD",
};

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];
const paymentStatusOptions = ["paid", "pending", "refunded"];

const AdminOrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

  const {
    data: orders,
    loading,
    error,
    refetch,
  } = useFetch((signal) => orderService.getAllOrders(signal));

  const stats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return { total: 0, pending: 0, revenue: 0, returnRequests: 0 };
    }
    const pending = orders.filter((o) => o.status === "pending").length;
    const revenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const returnRequests = orders.filter((o) => o.returnStatus === "requested").length;
    return { total: orders.length, pending, revenue, returnRequests };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const term = searchTerm.toLowerCase().trim();
    return orders.filter((order) => {
      const matchesTerm =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.user?.name?.toLowerCase().includes(term) ||
        order.user?.email?.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesPayment =
        paymentStatusFilter === "all" || order.paymentStatus === paymentStatusFilter;
      return matchesTerm && matchesStatus && matchesPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentStatusFilter]);

  const {
    page,
    setPage,
    totalPages,
    pageItems: pageOrders,
    totalItems,
  } = usePagination(filteredOrders, PAGE_SIZE);

  const resetToFirstPage = () => setPage(1);

  const handleStatusChange = async (order, status) => {
    try {
      await orderService.updateOrderStatus(order.id, status);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to update order status");
    }
  };

  const handleReturnDecision = async (order, decision) => {
    try {
      await orderService.reviewReturn(order.id, decision);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to save decision");
    }
  };

  if (loading) return <LoadingSpinner message="Loading orders..." />;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div>
      <h1 className={styles.title}>Orders</h1>
      <p className={styles.subtitle}>{orders.length} total orders</p>

      <div className={styles.grid}>
        <StatCard icon="🧾" label="Total Orders" value={stats.total} accent="indigo" />
        <StatCard icon="⏳" label="Pending" value={stats.pending} accent="amber" />
        <StatCard icon="💵" label="Revenue" value={`$${stats.revenue.toFixed(2)}`} accent="green" />
        <StatCard
          icon="🔄"
          label="Return Requests"
          value={stats.returnRequests}
          accent="purple"
        />
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍 Search order #, customer name or email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            resetToFirstPage();
          }}
          className={styles.searchInput}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            resetToFirstPage();
          }}
          className={styles.filterSelect}
        >
          <option value="all">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={paymentStatusFilter}
          onChange={(e) => {
            setPaymentStatusFilter(e.target.value);
            resetToFirstPage();
          }}
          className={styles.filterSelect}
        >
          <option value="all">All Payments</option>
          {paymentStatusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className={styles.noResultsStandalone}>No orders found</div>
      ) : (
        <div className={styles.listWrapper}>
          <table className={styles.list}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr>
                    <td>
                      <p className={styles.orderId}>
                        #{order.id.slice(-8)}
                      </p>
                      <p className={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td>
                      <p className={styles.customerName}>
                        {order.user?.name || "—"}
                      </p>
                      <p className={styles.customerEmail}>
                        {order.user?.email || ""}
                      </p>
                    </td>
                    <td>
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </td>
                    <td className={styles.total}>
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td>
                      <p className={styles.paymentMethod}>
                        {paymentMethodLabels[order.paymentMethod] ||
                          order.paymentMethod}
                      </p>
                      <p
                        className={
                          order.paymentStatus === "paid"
                            ? styles.paidLabel
                            : styles.paymentPendingLabel
                        }
                      >
                        {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                      </p>
                    </td>
                    <td>
                      <OrderStatusStepper
                        status={order.status}
                        onChange={(status) => handleStatusChange(order, status)}
                      />
                      {(order.returnStatus === "approved" ||
                        order.returnStatus === "rejected") && (
                        <p
                          className={`${styles.returnBadge} ${styles[`returnBadge_${order.returnStatus}`]}`}
                        >
                          {order.returnType === "exchange" ? "Exchange" : "Return"}{" "}
                          {order.returnStatus}
                        </p>
                      )}
                    </td>
                  </tr>
                  {order.returnStatus === "requested" && (
                    <tr className={styles.returnRow}>
                      <td colSpan={6} className={styles.returnCell}>
                        <div className={styles.returnRequest}>
                          <span className={styles.returnRequestLabel}>
                            🔄 {order.returnType === "exchange" ? "Exchange" : "Return"}{" "}
                            requested
                            {order.returnReason ? ` — "${order.returnReason}"` : ""}
                          </span>
                          <span className={styles.returnRequestButtons}>
                            <button
                              type="button"
                              className={styles.approveButton}
                              onClick={() => handleReturnDecision(order, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className={styles.rejectButton}
                              onClick={() => handleReturnDecision(order, "rejected")}
                            >
                              Reject
                            </button>
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
