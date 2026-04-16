import express from "express";
import {
  createPayment,
  handleIPN,
  getAllPayments,
  getPaymentsByPatient,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/", getAllPayments);
router.get("/patient/:patientId", getPaymentsByPatient);
router.post("/create", createPayment);
router.post("/notify", handleIPN);

export default router;