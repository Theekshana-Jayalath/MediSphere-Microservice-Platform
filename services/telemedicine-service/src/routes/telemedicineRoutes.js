import express from "express";
import {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  confirmSessionByDoctor,
  deleteSession,
  getSessionSummary,
} from "../controllers/telemedicineController.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Telemedicine service is healthy",
  });
});

router.post("/sessions", createSession);
router.get("/sessions", getAllSessions);
router.get("/sessions/summary", getSessionSummary);
router.get("/sessions/:id", getSessionById);
router.put("/sessions/:id", updateSession);
router.patch("/sessions/:id/confirm", confirmSessionByDoctor);
router.delete("/sessions/:id", deleteSession);

export default router;