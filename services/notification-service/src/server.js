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

app.use(express.json());

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

const PORT = process.env.PORT || 6002;

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});