import express from "express";
import mongoose from "mongoose";

import {
  getAllAppointments,
  getAppointmentsByPatient,
  searchAppointments,
  getSlots,
  createAppointment,
  rescheduleAppointment,
  paymentSuccess,
  approveAppointment,
  rejectAppointment,
  cancelAppointment,
  updatePaymentSuccess,
  updatePaymentStatus,
  markPaymentFailed
} from "../controllers/appointmentController.js";

const router = express.Router();

// Debug route to inspect DB connection and envs
router.get("/debug", (req, res) => {
  try {
    const state = mongoose.connection.readyState; // 0 disconnected,1 connected
    res.json({
      success: true,
      mongoReadyState: state,
      MONGODB_URI_present: !!process.env.MONGODB_URI,
      API_GATEWAY_URL: process.env.API_GATEWAY_URL || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get("/", getAllAppointments);
router.get("/patient/:patientId", getAppointmentsByPatient);
router.get("/search", searchAppointments);
router.get("/slots", getSlots);

router.post("/", createAppointment);

router.put("/:id/reschedule", rescheduleAppointment);
router.put("/:id/payment", paymentSuccess);
router.put("/:id/approve", approveAppointment);
router.put("/:id/reject", rejectAppointment);
router.put("/:id/complete", async (req, res, next) => {
  // forward to controller complete handler if exists
  try {
    const { id } = req.params;
    // require controller from file to avoid circular issues
    const module = await import("../controllers/appointmentController.js");
    if (typeof module.completeAppointment === "function") {
      return module.completeAppointment(req, res, next);
    }

    // fallback: simple update
    const { default: Appointment } = await import("../models/appointmentModel.js");
    const updated = await Appointment.findByIdAndUpdate(id, { status: "COMPLETED" }, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});
router.put("/:id/cancel", cancelAppointment);

// Add these routes to your appointment routes file

// Payment success update
router.put('/payment/success/:id', updatePaymentSuccess);

// Alternative payment update
router.post('/update-payment-status', updatePaymentStatus);

// Mark payment failed
router.put('/payment/failed/:id', markPaymentFailed);

export default router;