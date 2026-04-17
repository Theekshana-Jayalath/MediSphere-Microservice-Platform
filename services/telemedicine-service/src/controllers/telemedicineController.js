import mongoose from "mongoose";
import axios from "axios";
import Session from "../models/sessionModel.js";
import {
  generateRoomName,
  generateMeetingLink,
  calculateSessionCounts,
} from "../services/telemedicineService.js";

const getCleanObjectId = (rawId) => {
  const cleanedId = String(rawId || "").replace(/['"]/g, "").trim();

  if (!mongoose.Types.ObjectId.isValid(cleanedId)) {
    return null;
  }

  return cleanedId;
};

const formatSriLankaPhoneNumber = (phoneNumber) => {
  const cleaned = String(phoneNumber || "").replace(/\s+/g, "").trim();

  if (!cleaned) return "";

  if (cleaned.startsWith("+94")) return cleaned;
  if (cleaned.startsWith("94")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+94${cleaned.substring(1)}`;

  return cleaned;
};

export const createSessionFromConfirmedAppointment = async (req, res) => {
  try {
    const {
      appointmentId,
      doctorId,
      doctorName,
      doctorEmail,
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      specialty,
      scheduledTime,
      notes,
      appointmentStatus,
    } = req.body;

    if (
      !appointmentId ||
      !doctorId ||
      !doctorName ||
      !patientId ||
      !patientName ||
      !patientEmail ||
      !patientPhone ||
      !scheduledTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "appointmentId, doctorId, doctorName, patientId, patientName, patientEmail, patientPhone, and scheduledTime are required",
      });
    }

    if (String(appointmentStatus || "").toLowerCase() !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Session can only be created for a confirmed appointment",
      });
    }

    const existingSession = await Session.findOne({ appointmentId });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: "A session already exists for this appointment",
      });
    }

    const roomName = generateRoomName(appointmentId);
    const meetingLink = generateMeetingLink(roomName);

    const session = await Session.create({
      appointmentId,
      doctorId,
      doctorName,
      doctorEmail: doctorEmail || "",
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      specialty: specialty || "",
      roomName,
      meetingLink,
      scheduledTime,
      notes: notes || "",
      status: "scheduled",
      isActive: true,
    });

    try {
      if (!process.env.NOTIFICATION_SERVICE_URL) {
        console.warn("NOTIFICATION_SERVICE_URL is not set in .env");
      } else {
        const payload = {
          appointmentId: session.appointmentId,
          patientEmail: session.patientEmail,
          patientPhone: formatSriLankaPhoneNumber(session.patientPhone),
          patientName: session.patientName,
          doctorName: session.doctorName,
          doctorEmail: session.doctorEmail,
          specialty: session.specialty,
          scheduledTime: session.scheduledTime,
          meetingLink: session.meetingLink,
          status: "Scheduled",
        };

        const response = await axios.post(
          `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/telemedicine-confirmation`,
          payload
        );

        console.log("Notification sent successfully:", response.data);
      }
    } catch (notifyError) {
      console.error(
        "Failed to send notification:",
        notifyError.response?.data || notifyError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Session created from confirmed appointment successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create session from confirmed appointment",
      error: error.message,
    });
  }
};

export const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    const counts = calculateSessionCounts(sessions);

    return res.status(200).json({
      success: true,
      message: "Sessions fetched successfully",
      counts,
      sessions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sessions",
      error: error.message,
    });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const id = getCleanObjectId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid session id",
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Session fetched successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch session",
      error: error.message,
    });
  }
};

export const updateSession = async (req, res) => {
  try {
    const id = getCleanObjectId(req.params.id);
    const {
      doctorId,
      doctorName,
      doctorEmail,
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      specialty,
      scheduledTime,
      notes,
      status,
      isActive,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid session id",
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (doctorId !== undefined) session.doctorId = doctorId;
    if (doctorName !== undefined) session.doctorName = doctorName;
    if (doctorEmail !== undefined) session.doctorEmail = doctorEmail;
    if (patientId !== undefined) session.patientId = patientId;
    if (patientName !== undefined) session.patientName = patientName;
    if (patientEmail !== undefined) session.patientEmail = patientEmail;
    if (patientPhone !== undefined) session.patientPhone = patientPhone;
    if (specialty !== undefined) session.specialty = specialty;
    if (scheduledTime !== undefined) session.scheduledTime = scheduledTime;
    if (notes !== undefined) session.notes = notes;
    if (isActive !== undefined) session.isActive = isActive;

    if (status !== undefined) {
      const allowedStatuses = ["scheduled", "started", "completed", "cancelled"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      session.status = status;
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Session updated successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update session",
      error: error.message,
    });
  }
};

export const startSession = async (req, res) => {
  try {
    const id = getCleanObjectId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid session id",
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Only scheduled sessions can be started",
      });
    }

    session.status = "started";
    session.startedAt = new Date();
    session.isActive = true;

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Session started successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to start session",
      error: error.message,
    });
  }
};

export const completeSession = async (req, res) => {
  try {
    const id = getCleanObjectId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid session id",
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Session already completed",
      });
    }

    if (session.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled session cannot be completed",
      });
    }

    if (session.status !== "started" && session.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Only scheduled or started sessions can be completed",
      });
    }

    session.status = "completed";
    session.completedAt = new Date();
    session.isActive = false;

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Session marked as completed successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to complete session",
      error: error.message,
    });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const id = getCleanObjectId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid session id",
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    await session.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete session",
      error: error.message,
    });
  }
};

export const getSessionSummary = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    const counts = calculateSessionCounts(sessions);

    return res.status(200).json({
      success: true,
      message: "Session summary fetched successfully",
      summary: counts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch session summary",
      error: error.message,
    });
  }
};