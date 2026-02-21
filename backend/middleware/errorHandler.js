export function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Maximum size is 50MB." });
  }

  if (err.message?.includes("Only CSV")) {
    return res.status(400).json({ error: err.message });
  }

  // Generic error
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
}