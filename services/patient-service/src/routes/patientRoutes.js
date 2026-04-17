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
  updatePatientById,
  deletePatientById,
} from "../controllers/patientController.js";

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

// Public registration route
router.post("/", createPatientProfileForRegistration);

// Patient self routes
router.post("/profile", authMiddleware, createPatientProfile);
router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.get("/me/prescriptions", authMiddleware, getMyPrescriptions);
router.get("/me/history", authMiddleware, getMyMedicalHistory);

// Admin/general routes
router.get("/", authMiddleware, adminOnly, getAllPatients);
router.get("/:id/prescriptions", authMiddleware, adminOnly, getPatientPrescriptionsById);
router.get("/:id/history", authMiddleware, adminOnly, getPatientHistoryById);
router.get("/:id", authMiddleware, adminOnly, getPatientById);
router.put("/:id", authMiddleware, adminOnly, updatePatientById);
router.delete("/:id", authMiddleware, adminOnly, deletePatientById);

export default router;