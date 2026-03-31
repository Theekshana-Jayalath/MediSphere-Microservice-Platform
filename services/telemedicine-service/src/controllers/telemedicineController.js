import Session from "../models/sessionModel.js";
import {
  generateRoomName,
  generateMeetingLink,
  calculateSessionCounts,
} from "../services/telemedicineService.js";

export const createSession = async (req, res) => {
  try {
    const {
      appointmentId,
      doctorId,
      doctorName,
      patientId,
      patientName,
      specialty,
      scheduledTime,
      notes,
    } = req.body;

    if (
      !appointmentId ||
      !doctorId ||
      !doctorName ||
      !patientId ||
      !patientName ||
      !scheduledTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "appointmentId, doctorId, doctorName, patientId, patientName, and scheduledTime are required",
      });
    }

    const existingSession = await Session.findOne({ appointmentId });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: "A session already exists for this appointmentId",
      });
    }

    const roomName = generateRoomName(appointmentId);
    const meetingLink = generateMeetingLink(roomName);

    const session = await Session.create({
      appointmentId,
      doctorId,
      doctorName,
      patientId,
      patientName,
      specialty,
      roomName,
      meetingLink,
      scheduledTime,
      notes,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Telemedicine session request created successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create session",
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
    const { id } = req.params;

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
    const { id } = req.params;
    const {
      doctorId,
      doctorName,
      patientId,
      patientName,
      specialty,
      scheduledTime,
      notes,
      status,
    } = req.body;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.status === "scheduled") {
      session.status = "pending";
    }

    if (doctorId !== undefined) session.doctorId = doctorId;
    if (doctorName !== undefined) session.doctorName = doctorName;
    if (patientId !== undefined) session.patientId = patientId;
    if (patientName !== undefined) session.patientName = patientName;
    if (specialty !== undefined) session.specialty = specialty;
    if (scheduledTime !== undefined) session.scheduledTime = scheduledTime;
    if (notes !== undefined) session.notes = notes;
    if (status !== undefined) session.status = status;

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

export const confirmSessionByDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "doctorId is required",
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.doctorId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned doctor can confirm this session",
      });
    }

    session.status = "confirmed";
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Session confirmed successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to confirm session",
      error: error.message,
    });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

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
