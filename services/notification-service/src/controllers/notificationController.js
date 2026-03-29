import { sendTelemedicineConfirmationEmail } from "../services/emailService.js";

export const sendTelemedicineConfirmation = async (req, res) => {
  try {
    const {
      patientEmail,
      patientName,
      doctorName,
      specialty,
      scheduledTime,
      meetingLink,
    } = req.body;

    if (
      !patientEmail ||
      !patientName ||
      !doctorName ||
      !scheduledTime ||
      !meetingLink
    ) {
      return res.status(400).json({
        success: false,
        message:
          "patientEmail, patientName, doctorName, scheduledTime, and meetingLink are required",
      });
    }

    await sendTelemedicineConfirmationEmail({
      patientEmail,
      patientName,
      doctorName,
      specialty,
      scheduledTime,
      meetingLink,
    });

    return res.status(200).json({
      success: true,
      message: "Telemedicine confirmation email sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send telemedicine confirmation email",
      error: error.message,
    });
  }
};