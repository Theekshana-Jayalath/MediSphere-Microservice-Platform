import express from "express";
import {
  createPayment,
  handleIPN,
  getAllPayments,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/", getAllPayments);
router.post("/create", createPayment);
router.post("/notify", handleIPN);

export default router;