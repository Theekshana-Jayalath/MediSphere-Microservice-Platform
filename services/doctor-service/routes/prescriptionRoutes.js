import express from "express";
import {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  getPrescriptionsByDoctor,
  getPrescriptionsByPatient,
  updatePrescription,
  deletePrescription,
} from "../controllers/prescriptionController.js";

const router = express.Router();

router.post("/", createPrescription);
router.get("/", getAllPrescriptions);
router.get("/doctor/:doctorId", getPrescriptionsByDoctor);
router.get("/patient/:patientId", getPrescriptionsByPatient);
router.get("/:id", getPrescriptionById);
router.put("/:id", updatePrescription);
router.delete("/:id", deletePrescription);

export default router;