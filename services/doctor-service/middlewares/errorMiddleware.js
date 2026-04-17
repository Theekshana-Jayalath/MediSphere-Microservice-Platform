const errorHandler = (err, req, res, next) => {
  console.error("Error caught by middleware:", err.message);
  console.error("Error details:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
};

export default errorHandler;