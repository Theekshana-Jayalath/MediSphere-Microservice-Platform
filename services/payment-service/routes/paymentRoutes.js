// routes/paymentRoutes.js
import express from "express";
import { createPayment, handleIPN, getPaymentStatus, getPaymentByAppointment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create", createPayment);
router.post("/ipn", handleIPN);
router.get("/status/:orderId", getPaymentStatus);
router.get("/appointment/:appointmentId", getPaymentByAppointment);

export default router;