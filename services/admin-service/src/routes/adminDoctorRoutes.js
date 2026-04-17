import express from "express";
import {
  getAllDoctors,
  getPendingDoctors,
  getDoctorById,
  approveDoctor,
  rejectDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/adminDoctorController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get("/", getAllDoctors);
router.get("/pending", getPendingDoctors);
router.get("/:id", getDoctorById);
router.put("/:id/approve", approveDoctor);
router.put("/:id/reject", rejectDoctor);
router.put("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

export default router;