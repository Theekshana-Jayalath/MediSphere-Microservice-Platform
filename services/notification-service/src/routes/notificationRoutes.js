import express from "express";
import { sendTelemedicineConfirmation } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Notification service is healthy",
  });
});

router.post("/telemedicine-confirmation", sendTelemedicineConfirmation);

export default router;