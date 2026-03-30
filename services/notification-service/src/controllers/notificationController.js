import { sendTelemedicineConfirmationEmail } from "../services/emailService.js";
import { sendSMS } from "../services/smsService.js";

  export const sendAppointmentConfirmedNotification = async (req, res) => {
  try {
    const {
      patientEmail,
      patientPhone,
      patientName,
      doctorEmail,
      doctorPhone,
      doctorName,
      specialty,
      scheduledTime,
      meetingLink,
    } = req.body;

    // ✅ validation
    if (
      !patientEmail ||
      !patientPhone ||
      !patientName ||
      !doctorEmail ||
      !doctorPhone ||
      !doctorName ||
      !scheduledTime ||
      !meetingLink
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ 1. Send EMAILS (you already have this)
    await sendTelemedicineConfirmationEmail({
      patientEmail,
      patientName,
      doctorName,
      specialty,
      scheduledTime,
      meetingLink,
    });

    await sendTelemedicineConfirmationEmail({
      patientEmail: doctorEmail,
      patientName: `Dr. ${doctorName}`,
      doctorName,
      specialty,
      scheduledTime,
      meetingLink,
    });

    // ✅ 2. Send SMS (TEST NOW — immediate send)
    const patientMessage = `Hello ${patientName}, your appointment with Dr. ${doctorName} is confirmed for ${scheduledTime}. Link: ${meetingLink}`;

    const doctorMessage = `Hello Dr. ${doctorName}, appointment with ${patientName} confirmed at ${scheduledTime}.`;

    await sendSMS({
      to: patientPhone,
      message: patientMessage,
    });

    await sendSMS({
      to: doctorPhone,
      message: doctorMessage,
    });

    return res.status(200).json({
      success: true,
      message: "Emails and SMS sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Notification failed",
      error: error.message,
    });
  }
};