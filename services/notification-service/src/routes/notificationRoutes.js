import express from "express";
import { sendAppointmentConfirmedNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Notification service is working",
  });
});

router.post("/appointment-confirmed", sendAppointmentConfirmedNotification);

export default router;