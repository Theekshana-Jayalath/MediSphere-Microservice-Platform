import express from "express";
import {
  createPayment,
  handleIPN,
  getPaymentStatus,
  getPaymentByAppointment,
  getAllPayments,
  getPaymentsByPatient,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/", getAllPayments);
router.get("/patient/:patientId", getPaymentsByPatient);
router.post("/create", createPayment);
router.post("/ipn", handleIPN);
router.get("/status/:orderId", getPaymentStatus);
router.get("/appointment/:appointmentId", getPaymentByAppointment);

export default router;