import express from "express";
import {
  createSessionFromConfirmedAppointment,
  getDoctorSessionsById,
  getAllSessions,
  getSessionById,
  updateSession,
  startSession,
  completeSession,
  deleteSession,
  getSessionSummary,
  getRecentSessionsDebug,
} from "../controllers/telemedicineController.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/", createSessionFromConfirmedAppointment);

// ✅ No middleware: get sessions by doctorId
router.get("/doctor/sessions/:doctorId", getDoctorSessionsById);

router.get("/", getAllSessions);
router.get("/summary", getSessionSummary);
// Debug route for quick diagnostics (place before param routes)
router.get("/debug", (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    res.json({
      success: true,
      mongoReadyState: state,
      MONGO_URI_present: !!process.env.MONGO_URI,
      NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// Recent sessions debug
router.get("/debug/sessions", getRecentSessionsDebug);

router.get("/:id", getSessionById);
router.put("/:id", updateSession);
router.patch("/:id/start", startSession);
router.patch("/:id/complete", completeSession);
router.delete("/:id", deleteSession);

// Debug route for quick diagnostics
router.get("/debug", (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    res.json({
      success: true,
      mongoReadyState: state,
      MONGO_URI_present: !!process.env.MONGO_URI,
      NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;