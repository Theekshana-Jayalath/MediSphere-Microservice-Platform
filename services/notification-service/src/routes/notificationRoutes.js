import express from "express";
import { sendAppointmentConfirmedNotification } from "../controllers/notificationController.js";
import { sendWhatsAppNotification } from "../controllers/notificationController.js";


const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ success: true, message: "Notification OK" });
});

// 🔥 MAIN ROUTE
router.post("/telemedicine-confirmation", sendAppointmentConfirmedNotification);


// whatsapp 
router.post("/whatsapp", sendWhatsAppNotification);

export default router;


