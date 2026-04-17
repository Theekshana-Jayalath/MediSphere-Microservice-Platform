import express from "express";
import {
  getAppointmentsForDoctor,
  updateDoctorAppointmentStatus,
} from "../controllers/appointmentProxyController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("doctor", "admin", "ADMIN"),
  getAppointmentsForDoctor
);

router.get(
  "/doctor/:doctorId",
  protect,
  authorizeRoles("doctor", "admin", "ADMIN"),
  getAppointmentsForDoctor
);

router.patch(
  "/:appointmentId/status",
  protect,
  authorizeRoles("doctor", "admin", "ADMIN"),
  updateDoctorAppointmentStatus
);

export default router;
