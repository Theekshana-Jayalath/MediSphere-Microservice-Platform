import axios from "axios";
import Appointment from "../models/appointmentModel.js";
import { generateSlots } from "../service/slotService.js";
import axios from "axios";

/* ---------------------------------------
   GET ALL APPOINTMENTS
---------------------------------------- */
export async function getAllAppointments(req, res) {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.status(200).json(appointments);
  } catch (error) {
    console.error("❌ Error fetching all appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   GET APPOINTMENTS BY PATIENT
---------------------------------------- */
export async function getAppointmentsByPatient(req, res) {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({ patientId }).sort({
      createdAt: -1,
    });

    res.status(200).json(appointments);
  } catch (error) {
    console.error("❌ Error fetching patient appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient appointments",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   SEARCH APPOINTMENTS
---------------------------------------- */
export async function searchAppointments(req, res) {
  try {
    const { doctorName, specialization, hospital, type } = req.query;

    const query = {};

    if (doctorName) query.doctorName = new RegExp(doctorName, "i");
    if (specialization)
      query.$or = [
        { doctorSpecialty: new RegExp(specialization, "i") },
        { specialization: new RegExp(specialization, "i") },
      ];
    if (hospital) query.hospital = new RegExp(hospital, "i");
    if (type) {
      query.$or = [
        ...(query.$or || []),
        { consultationType: new RegExp(type, "i") },
        { appointmentType: new RegExp(type, "i") },
      ];
    }

    const results = await Appointment.find(query).sort({ createdAt: -1 });

    res.status(200).json(results);
  } catch (error) {
    console.error("❌ Error searching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search appointments",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   GET AVAILABLE SLOTS
---------------------------------------- */
export async function getSlots(req, res) {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date are required",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      return res.status(400).json({
        success: false,
        message: "Past date not allowed",
      });
    }

    const slots = await generateSlots(doctorId, date);
    res.status(200).json(slots);
  } catch (error) {
    console.error("❌ Error getting slots:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get slots",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   CREATE APPOINTMENT
---------------------------------------- */
export async function createAppointment(req, res) {
  try {
    const data = { ...req.body };

    console.log(
      "📥 Received createAppointment request:",
      JSON.stringify(data, null, 2)
    );

    const requiredFields = [
      "patientId",
      "doctorId",
      "appointmentDate",
      "amount",
    ];

    for (const field of requiredFields) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    data.startTime = data.startTime || data.appointmentTime || "00:00";
    data.appointmentTime = data.appointmentTime || data.startTime;

    data.duration =
      Number(data.duration) ||
      (data.selectedConsultation?.duration
        ? Number(data.selectedConsultation.duration)
        : 30);

    const [h = "0", m = "0"] = String(data.startTime).split(":");
    const start = parseInt(h, 10) * 60 + parseInt(m, 10);
    const end = start + Number(data.duration);

    const endHour = Math.floor(end / 60);
    const endMin = end % 60;

    data.endTime = `${String(endHour).padStart(2, "0")}:${String(
      endMin
    ).padStart(2, "0")}`;

    const docId = data.doctorId;
    if (docId && (!data.doctorName || !data.doctorSpecialty || !data.hospital)) {
      const doctorServiceBase =
        process.env.DOCTOR_SERVICE_URL || "http://localhost:6010";

      try {
        const dresp = await axios.get(
          `${doctorServiceBase}/api/doctors/${docId}`,
          { timeout: 5000 }
        );

        const d = dresp.data;

        if (d) {
          data.doctorName =
            data.doctorName || d.fullName || d.name || d.displayName || "";
          data.doctorSpecialty =
            data.doctorSpecialty || d.specialization || d.specialty || "";
          data.hospital = data.hospital || d.baseHospital || d.hospital || "";
        }
      } catch (err) {
        console.warn(
          "⚠️ Could not fetch doctor details, using provided data:",
          err?.message || err
        );
      }
    }

    data.doctorName = data.doctorName || "Unknown Doctor";
    data.doctorSpecialty = data.doctorSpecialty || "General";
    data.hospital = data.hospital || "Not Provided";

    const existingSlot = await Appointment.findOne({
      doctorId: data.doctorId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.startTime,
      status: { $ne: "CANCELLED" },
    });

    if (existingSlot) {
      if (
        data.patientId &&
        String(existingSlot.patientId) === String(data.patientId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Duplicate booking: patient already booked this exact slot",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Time slot already taken for this doctor",
      });
    }

    const booked = await Appointment.find({
      doctorId: data.doctorId,
      appointmentDate: data.appointmentDate,
      status: { $ne: "CANCELLED" },
    });

    for (const b of booked) {
      const baseTime = b.startTime || b.appointmentTime || "00:00";
      const [bh = "0", bm = "0"] = String(baseTime).split(":");
      const bStart = parseInt(bh, 10) * 60 + parseInt(bm, 10);
      const bDuration = Number(b.duration) || 30;
      const bEnd = bStart + bDuration;

      if (start < bEnd && end > bStart) {
        return res.status(400).json({
          success: false,
          message: "Time overlap",
        });
      }
    }

    if (!data.appointmentId) {
      data.appointmentId = `APT_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
    }

    let tries = 0;
    while (tries < 5) {
      const exists = await Appointment.findOne({
        appointmentId: data.appointmentId,
      });

      if (!exists) break;

      data.appointmentId = `APT_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      tries++;
    }

    if (!data.status) data.status = "PENDING";

    const appointment = await Appointment.create(data);

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment,
    });
  } catch (err) {
    console.error("❌ Create appointment error:", err);

    if (err?.name === "ValidationError") {
      const details = {};
      for (const [key, value] of Object.entries(err.errors || {})) {
        details[key] = value.message || String(value);
      }

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details,
      });
    }

    res.status(500).json({
      success: false,
      message: err?.message || "Internal server error",
    });
  }
}

/* ---------------------------------------
   RESCHEDULE APPOINTMENT
---------------------------------------- */
export async function rescheduleAppointment(req, res) {
  try {
    const { id } = req.params;
    const { appointmentDate, appointmentTime, startTime, duration } = req.body;

    let appointment = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      appointment = await Appointment.findOne({ appointmentId: id });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const newDate = appointmentDate || appointment.appointmentDate;
    const newStartTime =
      startTime || appointmentTime || appointment.startTime || appointment.appointmentTime;
    const newDuration = Number(duration) || Number(appointment.duration) || 30;

    const [h = "0", m = "0"] = String(newStartTime).split(":");
    const start = parseInt(h, 10) * 60 + parseInt(m, 10);
    const end = start + newDuration;

    const endHour = Math.floor(end / 60);
    const endMin = end % 60;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(
      2,
      "0"
    )}`;

    const booked = await Appointment.find({
      _id: { $ne: appointment._id },
      doctorId: appointment.doctorId,
      appointmentDate: newDate,
      status: { $ne: "CANCELLED" },
    });

    for (const b of booked) {
      const baseTime = b.startTime || b.appointmentTime || "00:00";
      const [bh = "0", bm = "0"] = String(baseTime).split(":");
      const bStart = parseInt(bh, 10) * 60 + parseInt(bm, 10);
      const bDuration = Number(b.duration) || 30;
      const bEnd = bStart + bDuration;

      if (start < bEnd && end > bStart) {
        return res.status(400).json({
          success: false,
          message: "New time overlaps with another appointment",
        });
      }
    }

    appointment.appointmentDate = newDate;
    appointment.appointmentTime = newStartTime;
    appointment.startTime = newStartTime;
    appointment.duration = newDuration;
    appointment.endTime = endTime;

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment,
    });
  } catch (error) {
    console.error("❌ Error rescheduling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reschedule appointment",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   PAYMENT SUCCESS
---------------------------------------- */
export async function paymentSuccess(req, res) {
  try {
    const { id } = req.params;

    let updated = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      updated = await Appointment.findByIdAndUpdate(
        id,
        {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
        { new: true }
      );
    }

    if (!updated) {
      updated = await Appointment.findOneAndUpdate(
        { appointmentId: id },
        {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
        { new: true }
      );
    }

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Payment success update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment success",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   APPROVE APPOINTMENT
---------------------------------------- */
export async function approveAppointment(req, res) {
  try {
    const { id } = req.params;

    let updated = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      updated = await Appointment.findByIdAndUpdate(
        id,
        { status: "CONFIRMED" },
        { new: true }
      );
    }

    if (!updated) {
      updated = await Appointment.findOneAndUpdate(
        { appointmentId: id },
        { status: "CONFIRMED" },
        { new: true }
      );
    }

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    try {
      const telemedicineBase =
        process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:6001";

      const telemedicinePayload = {
        appointmentId: updated.appointmentId || updated._id.toString(),
        doctorId: updated.doctorId,
        doctorName: updated.doctorName || "Unknown Doctor",
        doctorEmail: updated.doctorEmail || "",
        patientId: updated.patientId,
        patientName: updated.patientName || "",
        patientEmail: updated.patientEmail || "",
        patientPhone: updated.phoneNumber || updated.patientPhone || "",
        specialty:
          updated.doctorSpecialty || updated.specialization || "General",
        scheduledTime: new Date(updated.appointmentDate),
        appointmentStatus: "CONFIRMED",
        notes: "",
      };

      console.log("Telemedicine payload:", telemedicinePayload);

      const telemedicineResponse = await axios.post(
        `${telemedicineBase}/api/telemedicine`,
        telemedicinePayload,
        { timeout: 8000 }
      );

      return res.status(200).json({
        success: true,
        message: "Appointment approved and session created successfully",
        appointment: updated,
        telemedicine: telemedicineResponse.data,
      });
    } catch (teleErr) {
      console.error(
        "❌ Telemedicine session creation failed:",
        teleErr.response?.data || teleErr.message
      );

      return res.status(500).json({
        success: false,
        message: "Appointment approved, but telemedicine session creation failed",
        appointment: updated,
        telemedicineError: teleErr.response?.data || teleErr.message,
      });
    }
  } catch (error) {
    console.error("❌ Approve appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve appointment",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   REJECT APPOINTMENT
---------------------------------------- */
export async function rejectAppointment(req, res) {
  try {
    const { id } = req.params;

    let appointment = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      appointment = await Appointment.findOne({ appointmentId: id });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.status = "CANCELLED";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment rejected successfully",
      appointment,
    });
  } catch (error) {
    console.error("❌ Reject appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject appointment",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   CANCEL APPOINTMENT
---------------------------------------- */
export async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;

    let appointment = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      appointment = await Appointment.findOne({ appointmentId: id });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.status = "CANCELLED";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("❌ Cancel appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   UPDATE PAYMENT SUCCESS
---------------------------------------- */
export async function updatePaymentSuccess(req, res) {
  try {
    const { id } = req.params;
    const { orderId, paymentStatus, status, paidAt } = req.body;

    console.log("🔵 Updating appointment payment success:", { id, orderId });

    let appointment = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      appointment = await Appointment.findByIdAndUpdate(
        id,
        {
          paymentStatus: paymentStatus || "PAID",
          status: status || "CONFIRMED",
          paymentId: orderId,
          paidAt: paidAt || new Date(),
        },
        { new: true }
      );
    }

    if (!appointment) {
      appointment = await Appointment.findOneAndUpdate(
        { appointmentId: id },
        {
          paymentStatus: paymentStatus || "PAID",
          status: status || "CONFIRMED",
          paymentId: orderId,
          paidAt: paidAt || new Date(),
        },
        { new: true }
      );
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("❌ Update payment success error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating appointment",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   UPDATE PAYMENT STATUS
---------------------------------------- */
export async function updatePaymentStatus(req, res) {
  try {
    const { appointmentId, orderId, paymentStatus, status } = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      { appointmentId },
      {
        paymentStatus: paymentStatus || "PAID",
        status: status || "CONFIRMED",
        paymentId: orderId,
        paidAt: new Date(),
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("❌ Alternative update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating appointment",
      error: error.message,
    });
  }
}

/* ---------------------------------------
   MARK PAYMENT FAILED
---------------------------------------- */
export async function markPaymentFailed(req, res) {
  try {
    const { id } = req.params;
    const { orderId, statusCode } = req.body;

    let appointment = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      appointment = await Appointment.findByIdAndUpdate(
        id,
        {
          paymentStatus: "FAILED",
          paymentId: orderId,
          failureReason: `Payment failed with status code: ${statusCode}`,
        },
        { new: true }
      );
    }

    if (!appointment) {
      appointment = await Appointment.findOneAndUpdate(
        { appointmentId: id },
        {
          paymentStatus: "FAILED",
          paymentId: orderId,
          failureReason: `Payment failed with status code: ${statusCode}`,
        },
        { new: true }
      );
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment marked as failed",
      appointment,
    });
  } catch (error) {
    console.error("❌ Error marking payment failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark payment as failed",
      error: error.message,
    });
  }
}