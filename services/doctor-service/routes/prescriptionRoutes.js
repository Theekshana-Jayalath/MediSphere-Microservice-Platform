import express from "express";
import * as prescriptionController from "../controllers/prescriptionController.js";

const router = express.Router();

router.post("/", prescriptionController.createPrescription);
router.get("/", prescriptionController.getAllPrescriptions);
router.get("/doctor/:doctorId", prescriptionController.getPrescriptionsByDoctor);
router.get("/patient/:patientId", prescriptionController.getPrescriptionsByPatient);
router.get("/:id", prescriptionController.getPrescriptionById);
router.put("/:id", prescriptionController.updatePrescription);
router.delete("/:id", prescriptionController.deletePrescription);

export default router;