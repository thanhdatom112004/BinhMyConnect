function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Lỗi máy chủ"
      : err.message || "Lỗi máy chủ";
  res.status(status).json({
    success: false,
    message,
  });
}

module.exports = { errorHandler };
