import express from "express";
import { createPayment, handleIPN } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create", createPayment);
router.post("/ipn", handleIPN); // PayHere notify_url will POST here

export default router;