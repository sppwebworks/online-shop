const formatMoney = (amount) => `$${Number(amount).toFixed(2)}`;

const layout = (title, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #0f172a;">
    <h2 style="margin: 0 0 16px;">${title}</h2>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">ProductsApp — this is an automated message.</p>
  </div>
`;

const orderItemsRows = (items) =>
  items
    .map(
      (item) => `
        <tr>
          <td style="padding: 6px 0;">${item.title} × ${item.quantity}</td>
          <td style="padding: 6px 0; text-align: right;">${formatMoney(item.price * item.quantity)}</td>
        </tr>
      `,
    )
    .join("");

const welcomeEmail = (name) => ({
  subject: "Welcome to ProductsApp",
  html: layout(
    `Welcome, ${name}!`,
    `<p>Your account has been created. You can now browse products, place orders, and track them from the My Orders page.</p>`,
  ),
});

const passwordResetEmail = (name, resetUrl) => ({
  subject: "Reset your ProductsApp password",
  html: layout(
    "Reset your password",
    `
      <p>Hi ${name}, we received a request to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="display: inline-block; background: #16a34a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Reset Password</a></p>
      <p style="font-size: 13px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
    `,
  ),
});

const orderConfirmationEmail = (order) => ({
  subject: `Order confirmed — #${String(order._id).slice(-8)}`,
  html: layout(
    "Thanks for your order!",
    `
      <p>Order #${String(order._id).slice(-8)} has been placed.</p>
      <table style="width: 100%; border-collapse: collapse;">${orderItemsRows(order.items)}</table>
      <p style="text-align: right; font-weight: bold; margin-top: 8px;">Total: ${formatMoney(order.totalAmount)}</p>
      <p>Shipping to: ${order.shippingAddress.fullName}, ${order.shippingAddress.line1}, ${order.shippingAddress.city}</p>
    `,
  ),
});

const orderStatusUpdateEmail = (order) => ({
  subject: `Order #${String(order._id).slice(-8)} is now ${order.status}`,
  html: layout(
    "Order update",
    `<p>Your order #${String(order._id).slice(-8)} status changed to <strong>${order.status}</strong>.</p>`,
  ),
});

const orderCancelledEmail = (order) => ({
  subject: `Order #${String(order._id).slice(-8)} cancelled`,
  html: layout(
    "Order cancelled",
    `
      <p>Order #${String(order._id).slice(-8)} has been cancelled.</p>
      ${
        order.paymentStatus === "refunded"
          ? `<p>A refund of ${formatMoney(order.totalAmount)} has been issued.</p>`
          : ""
      }
    `,
  ),
});

const returnRequestedEmail = (order) => ({
  subject: `${order.returnType === "exchange" ? "Exchange" : "Return"} request received — #${String(order._id).slice(-8)}`,
  html: layout(
    "Request received",
    `<p>We've received your ${order.returnType} request for order #${String(order._id).slice(-8)}. We'll review it and get back to you soon.</p>`,
  ),
});

const returnDecisionEmail = (order) => ({
  subject: `Your ${order.returnType} request was ${order.returnStatus} — #${String(order._id).slice(-8)}`,
  html: layout(
    `Request ${order.returnStatus}`,
    `
      <p>Your ${order.returnType} request for order #${String(order._id).slice(-8)} was <strong>${order.returnStatus}</strong>.</p>
      ${
        order.returnStatus === "approved" && order.paymentStatus === "refunded"
          ? `<p>A refund of ${formatMoney(order.totalAmount)} has been issued.</p>`
          : ""
      }
    `,
  ),
});

const adminReturnNotificationEmail = (order) => ({
  subject: `New ${order.returnType} request — #${String(order._id).slice(-8)}`,
  html: layout(
    "New return/exchange request",
    `
      <p>Order #${String(order._id).slice(-8)} — ${order.returnType} requested.</p>
      <p>Reason: ${order.returnReason || "(none given)"}</p>
    `,
  ),
});

module.exports = {
  welcomeEmail,
  passwordResetEmail,
  orderConfirmationEmail,
  orderStatusUpdateEmail,
  orderCancelledEmail,
  returnRequestedEmail,
  returnDecisionEmail,
  adminReturnNotificationEmail,
};
