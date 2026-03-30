import { sendTelemedicineConfirmationEmail } from "../services/emailService.js";
import { sendAppointmentConfirmationSms } from "../services/smsService.js";

export const sendAppointmentConfirmedNotification = async (req, res) => {
  try {
    const {
      patientEmail,
      phoneNumber,
      patientName,
      doctorName,
      specialty,
      scheduledTime,
      meetingLink,
      status,
    } = req.body;

    if (
      !patientEmail ||
      !phoneNumber ||
      !patientName ||
      !doctorName ||
      !scheduledTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "patientEmail, phoneNumber, patientName, doctorName, and scheduledTime are required",
      });
    }

    if (status !== "Confirmed") {
      return res.status(400).json({
        success: false,
        message: "Notifications are sent only when appointment is Confirmed",
      });
    }

    const emailResult = await sendTelemedicineConfirmationEmail({
      patientEmail,
      patientName,
      doctorName,
      specialty,
      scheduledTime,
      meetingLink,
    });

    const smsResult = await sendAppointmentConfirmationSms({
      phoneNumber,
      patientName,
      doctorName,
      scheduledTime,
    });

    return res.status(200).json({
      success: true,
      message: "Email and SMS sent successfully",
      results: {
        email: emailResult.response || "Email sent",
        sms: smsResult,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send notifications",
      error: error.message,
    });
  }
};