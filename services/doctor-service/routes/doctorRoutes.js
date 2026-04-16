import express from "express";
import {
  loginDoctor,
  registerDoctor,
  getDoctorById,
  getDoctorApprovalStatus,
  updateDoctorProfile,
  getAllDoctors,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerDoctor);
router.post("/login", loginDoctor);

router.get("/", protect, authorizeRoles("admin", "ADMIN"), getAllDoctors);
router.get("/pending", protect, authorizeRoles("admin", "ADMIN"), getPendingDoctors);
router.get("/status/:id", getDoctorApprovalStatus);
router.get("/:id", getDoctorById);

router.patch(
  "/:id/profile",
  protect,
  authorizeRoles("doctor", "admin", "ADMIN"),
  updateDoctorProfile
);

router.put("/:id/approve", protect, authorizeRoles("admin", "ADMIN"), approveDoctor);
router.put("/:id/reject", protect, authorizeRoles("admin", "ADMIN"), rejectDoctor);
router.put("/:id", protect, authorizeRoles("admin", "ADMIN"), updateDoctor);
router.delete("/:id", protect, authorizeRoles("admin", "ADMIN"), deleteDoctor);

export default router;