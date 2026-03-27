import express from "express";

import {
  searchAppointments,
  getSlots,
  createAppointment,
  paymentSuccess,
  approveAppointment,
  rejectAppointment,
  cancelAppointment
} from "../controllers/appointmentController.js";

const router = express.Router();

router.get("/search", searchAppointments);
router.get("/slots", getSlots);

router.post("/", createAppointment);

router.put("/:id/payment", paymentSuccess);
router.put("/:id/approve", approveAppointment);
router.put("/:id/reject", rejectAppointment);

router.put("/:id/cancel", cancelAppointment);

export default router;