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
} from "../controllers/telemedicineController.js";

const router = express.Router();

/**
 * CREATE SESSION (Triggered after doctor confirms appointment)
 */
router.post("/", createSessionFromConfirmedAppointment);

/**
 * GET ALL SESSIONS
 */
router.get("/", getAllSessions);

/**
 * GET SUMMARY (dashboard / analytics)
 */
router.get("/summary", getSessionSummary);

/**
 * GET SINGLE SESSION
 */
router.get("/:id", getSessionById);

/**
 * UPDATE SESSION
 */
router.put("/:id", updateSession);

/**
 * START SESSION
 */
router.patch("/:id/start", startSession);

/**
 * COMPLETE SESSION
 */
router.patch("/:id/complete", completeSession);

/**
 * DELETE SESSION
 */
router.delete("/:id", deleteSession);

export default router;