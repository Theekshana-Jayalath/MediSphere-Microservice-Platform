import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

// keep a copy of the raw body so we can log it when JSON parsing fails
app.use(
  express.json({
    verify: (req, res, buf, encoding) => {
      try {
        req.rawBody = buf.toString(encoding || "utf8");
      } catch (e) {
        req.rawBody = undefined;
      }
    },
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Notification service is running",
  });
});

app.use("/api/notifications", notificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Body parser / JSON syntax error handler: give a clear message and log raw body
app.use((err, req, res, next) => {
  // body-parser emits SyntaxError objects for invalid JSON
  if (err && (err instanceof SyntaxError || err.type === "entity.parse.failed")) {
    console.error("Invalid JSON payload:", err.message);
    if (req && req.rawBody) {
      console.error("Raw body:", req.rawBody);
    }
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
      error: err.message,
    });
  }
  return next(err);
});

const PORT = process.env.PORT || 6002;

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});