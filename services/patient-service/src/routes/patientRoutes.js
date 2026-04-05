import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createPatientProfileForRegistration,
  createPatientProfile,
  getMyProfile,
  updateMyProfile,
  getMyPrescriptions,
  getMyMedicalHistory,
  getAllPatients,
  getPatientById,
  getPatientPrescriptionsById,
  getPatientHistoryById,
} from "../controllers/patientController.js";

const router = express.Router();

// Public registration route
router.post("/", createPatientProfileForRegistration);

// Patient self routes
router.post("/profile", authMiddleware, createPatientProfile);
router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.get("/me/prescriptions", authMiddleware, getMyPrescriptions);
router.get("/me/history", authMiddleware, getMyMedicalHistory);

// Admin/general routes
router.get("/", getAllPatients);
router.get("/:id/prescriptions", getPatientPrescriptionsById);
router.get("/:id/history", getPatientHistoryById);
router.get("/:id", getPatientById);

export default router;