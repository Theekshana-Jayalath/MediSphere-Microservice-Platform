import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createPatientProfile,
  getMyProfile,
  updateMyProfile,
  getMyPrescriptions,
  getMyMedicalHistory,
} from "../controllers/patientController.js";

const router = express.Router();

router.post("/profile", authMiddleware, createPatientProfile);
router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.get("/me/prescriptions", authMiddleware, getMyPrescriptions);
router.get("/me/history", authMiddleware, getMyMedicalHistory);

export default router;