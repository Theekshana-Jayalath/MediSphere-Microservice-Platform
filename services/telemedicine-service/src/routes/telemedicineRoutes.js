import express from "express";
import {
  createSessionFromConfirmedAppointment,
  getAllSessions,
  getSessionById,
  updateSession,
  startSession,
  completeSession,
  deleteSession,
  getSessionSummary,
} from "../controllers/sessionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/sessions/from-confirmed-appointment", createSessionFromConfirmedAppointment);
router.get("/sessions", getAllSessions);
router.get("/sessions/summary", getSessionSummary);
router.get("/sessions/:id", getSessionById);
router.put("/sessions/:id", updateSession);
router.patch("/sessions/:id/start", authMiddleware, startSession);
router.patch("/sessions/:id/complete", authMiddleware, completeSession);
router.delete("/sessions/:id", deleteSession);

export default router;