import express from "express";

import {
  searchAppointments,
  getSlots,
  createAppointment,
  paymentSuccess,
  approveAppointment,
  rejectAppointment,
  cancelAppointment,
  updatePaymentSuccess,
  updatePaymentStatus,
  markPaymentFailed
} from "../controllers/appointmentController.js";

const router = express.Router();

router.get("/search", searchAppointments);
router.get("/slots", getSlots);

router.post("/", createAppointment);

router.put("/:id/payment", paymentSuccess);
router.put("/:id/approve", approveAppointment);
router.put("/:id/reject", rejectAppointment);

router.put("/:id/cancel", cancelAppointment);

// Add these routes to your appointment routes file

// Payment success update
router.put('/payment/success/:id', updatePaymentSuccess);

// Alternative payment update
router.post('/update-payment-status', updatePaymentStatus);

// Mark payment failed
router.put('/payment/failed/:id', markPaymentFailed);

export default router;