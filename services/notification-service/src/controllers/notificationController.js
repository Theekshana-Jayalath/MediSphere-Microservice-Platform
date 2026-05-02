import { sendTelemedicineConfirmationEmail, sendTelemedicineEmailToDoctor } from "../services/emailService.js";
import { sendAppointmentConfirmationSms } from "../services/smsService.js";
import { sendWhatsApp } from "../utils/whatsappService.js";

export const sendAppointmentConfirmedNotification = async (req, res) => {
  try {
    const {
      patientEmail,
      doctorEmail,
      patientPhone,
      doctorPhone,
      patientName,
      doctorName,
      specialty,
      scheduledTime,
      meetingLink,
      status,
    } = req.body;

    // ✅ VALIDATION
    if (
      !patientEmail ||
      !doctorEmail ||
      !patientPhone ||
      !doctorPhone ||
      !patientName ||
      !doctorName ||
      !scheduledTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "patientEmail, doctorEmail, patientPhone, doctorPhone, patientName, doctorName, and scheduledTime are required",
      });
    }

  const normStatus = String(status || "").toLowerCase();
  if (normStatus !== "scheduled" && normStatus !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Notifications are sent only when appointment is confirmed/scheduled",
      });
    }

    // helper to normalize basic Sri Lanka phone numbers
    const formatSriLankaPhoneNumber = (phoneNumber) => {
      if (!phoneNumber) return phoneNumber;
      const cleaned = String(phoneNumber || "").replace(/\s+/g, "").trim();
      if (!cleaned) return cleaned;
      if (cleaned.startsWith("+94")) return cleaned;
      if (cleaned.startsWith("94")) return `+${cleaned}`;
      if (cleaned.startsWith("0")) return `+94${cleaned.substring(1)}`;
      return cleaned;
    };

    const patientPhoneNorm = formatSriLankaPhoneNumber(patientPhone);
    const doctorPhoneNorm = formatSriLankaPhoneNumber(doctorPhone);

    // Run notifications in parallel and don't fail everything on single channel error
    const tasks = {
      emailPatient: sendTelemedicineConfirmationEmail({
        patientEmail,
        patientName,
        doctorName,
        specialty,
        scheduledTime,
        meetingLink,
      }),
      emailDoctor: sendTelemedicineEmailToDoctor({
        doctorEmail,
        doctorName,
        patientName,
        specialty,
        scheduledTime,
        meetingLink,
      }),
      smsPatient: sendAppointmentConfirmationSms({
        phoneNumber: patientPhoneNorm,
        patientName,
        doctorName,
        scheduledTime,
      }),
      whatsappPatient: sendWhatsApp(
        patientPhoneNorm,
        `Hello ${patientName}, your appointment with Dr. ${doctorName} is confirmed.\n\nTime: ${scheduledTime}\nMeeting Link: ${meetingLink || "Not available"}`
      ),
      whatsappDoctor: sendWhatsApp(
        doctorPhoneNorm,
        `Hello Dr. ${doctorName}, you have a confirmed appointment with ${patientName}.\n\nTime: ${scheduledTime}\nMeeting Link: ${meetingLink || "Not available"}`
      ),
    };

    const settled = await Promise.allSettled(Object.values(tasks));

    const keys = Object.keys(tasks);
    const results = {};

    settled.forEach((r, idx) => {
      const key = keys[idx];
      if (r.status === "fulfilled") {
        // try to extract common values
        const val = r.value || {};
        results[key] = {
          success: true,
          data:
            val.sid || val.messageId || (val.response && val.response) || "sent",
        };
      } else {
        results[key] = { success: false, error: String(r.reason?.message || r.reason) };
      }
    });

    return res.status(200).json({ success: true, message: "Notifications attempted", results });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send notifications",
      error: error.message,
    });
  }
};

export const sendWhatsAppNotification = async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: "phone and message are required",
      });
    }

    const whatsappResult = await sendWhatsApp(phone, message);

    return res.status(200).json({
      success: true,
      message: "WhatsApp notification sent successfully",
      result: whatsappResult.sid || "WhatsApp sent",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "WhatsApp notification failed",
      error: error.message,
    });
  }
};