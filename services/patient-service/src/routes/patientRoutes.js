import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMyProfile,
  updateMyProfile,
  getMyPrescriptions,
  getMyMedicalHistory,
} from "../controllers/patientController.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.get("/me/prescriptions", authMiddleware, getMyPrescriptions);
router.get("/me/history", authMiddleware, getMyMedicalHistory);

export default router;