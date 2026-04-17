import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  uploadReport,
  getMyReports,
  getReportsByDoctor,
  getReportById,
  updateReport,
  deleteReport,
} from "../controllers/reportController.js";

const router = express.Router();

router.post("/upload", authMiddleware, upload.single("report"), uploadReport);
router.get("/me", authMiddleware, getMyReports);
router.get("/doctor/:doctorId", authMiddleware, getReportsByDoctor);
router.get("/:id", authMiddleware, getReportById);
router.put("/:id", authMiddleware, upload.single("report"), updateReport);
router.delete("/:id", authMiddleware, deleteReport);

export default router;