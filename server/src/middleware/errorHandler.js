// Wraps an async route handler so a rejected promise reaches the error
// handler below instead of crashing the process.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  console.error(err);
  res.status(status).json({ message: err.message || "Server error" });
};

module.exports = { asyncHandler, notFound, errorHandler };
