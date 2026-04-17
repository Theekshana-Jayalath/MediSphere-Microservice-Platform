import express from "express";
import {
  getAllPatients,
  getPatientById,
  getPatientReports,
  getPatientHistory,
  getPatientPrescriptions,
  updatePatient,
  deletePatient,
} from "../controllers/adminPatientController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get("/", getAllPatients);
router.get("/:id", getPatientById);
router.get("/:id/reports", getPatientReports);
router.get("/:id/history", getPatientHistory);
router.get("/:id/prescriptions", getPatientPrescriptions);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

export default router;