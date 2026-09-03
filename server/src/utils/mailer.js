const nodemailer = require("nodemailer");

let transporterPromise = null;
let usingEthereal = false;

// Resolves a transporter lazily so route handlers never wait on this at
// require-time. If real SMTP credentials are configured, use them. Otherwise
// fall back to an auto-provisioned Ethereal test inbox — nothing is actually
// delivered, but every send gets a preview URL logged to the server console,
// so the whole email pipeline is testable with zero setup. Swap in real
// EMAIL_HOST/EMAIL_USER/EMAIL_PASS whenever you're ready to send for real.
const getTransporter = () => {
  if (transporterPromise) return transporterPromise;

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      }),
    );
    return transporterPromise;
  }

  usingEthereal = true;
  transporterPromise = nodemailer.createTestAccount().then((account) =>
    nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    }),
  );
  return transporterPromise;
};

// Fire-and-forget by design: a failed email should never fail the request
// that triggered it (registration, placing an order, etc.), so every caller
// wraps this in its own try/catch and only logs on failure.
const sendMail = async ({ to, subject, html }) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "ProductsApp <no-reply@productsapp.test>",
    to,
    subject,
    html,
  });

  if (usingEthereal) {
    console.log(`[mailer] (Ethereal test mode) preview: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
};

module.exports = { sendMail };
