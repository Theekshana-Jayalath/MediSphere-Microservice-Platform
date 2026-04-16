// routes/paymentRoutes.js
import express from "express";
import { createPayment, handleIPN, getPaymentStatus } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create", createPayment);
router.post("/ipn", handleIPN);
router.get("/status/:orderId", getPaymentStatus);

export default router;