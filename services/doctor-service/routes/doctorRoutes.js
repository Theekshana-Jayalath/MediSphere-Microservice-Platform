import express from "express";
import {
  registerDoctor,
  getDoctorById,
  getDoctorApprovalStatus,
  updateDoctorProfile,
} from "../controllers/doctorController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerDoctor);
router.get("/:id", getDoctorById);
router.get("/status/:id", getDoctorApprovalStatus);
router.patch("/:id/profile", protect, authorizeRoles("doctor", "admin"), updateDoctorProfile);

export default router;