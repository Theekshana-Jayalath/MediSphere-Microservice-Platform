import axios from "axios";
import Appointment from "../models/appointmentModel.js";
import { generateSlots } from "../service/slotService.js";

const enrichAppointmentsWithPatientDisplayId = async (appointments) => {
  const appointmentList = Array.isArray(appointments) ? appointments : [appointments];

  const enriched = await Promise.all(
    appointmentList.map(async (appointment) => {
      try {
        const gatewayBase = process.env.API_GATEWAY_URL || "http://localhost:5015";
        const patientRes = await axios.get(
          `${gatewayBase}/api/patients/internal/${appointment.patientId}`
        );

        const patientData = patientRes.data?.data || patientRes.data || {};

        return {
          ...appointment.toObject(),
          patientDisplayId:
            patientData.patientId ||
            patientData.patientDisplayId ||
            appointment.patientId,
        };
      } catch (error) {
        return {
          ...appointment.toObject(),
          patientDisplayId: appointment.patientId,
        };
      }
    })
  );

  return enriched;
};

/* GET ALL */
export async function getAllAppointments(req, res) {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    const enrichedAppointments =
      await enrichAppointmentsWithPatientDisplayId(appointments);

    res.status(200).json(enrichedAppointments);
  } catch (err) {
    console.error("Failed to fetch appointments:", err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
}

/* GET BY PATIENT */
export async function getAppointmentsByPatient(req, res) {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({ patientId }).sort({
      appointmentDate: -1,
      createdAt: -1,
    });

    const enrichedAppointments =
      await enrichAppointmentsWithPatientDisplayId(appointments);

    res.status(200).json(enrichedAppointments);
  } catch (err) {
    console.error("Failed to fetch patient appointments:", err);
    res.status(500).json({ message: "Failed to fetch patient appointments" });
  }
}

/* SEARCH */
export async function searchAppointments(req, res) {
  const { doctorName, specialization, hospital, type } = req.query;

  let query = {};

  if (doctorName) query.doctorName = new RegExp(doctorName, "i");
  if (specialization) query.specialization = specialization;
  if (hospital) query.hospital = hospital;
  if (type) query.appointmentType = type;

  const results = await Appointment.find(query);
  const enrichedResults = await enrichAppointmentsWithPatientDisplayId(results);

  res.json(enrichedResults);
}

/* SLOTS */
export async function getSlots(req, res) {
  const { doctorId, date } = req.query;

  const today = new Date().setHours(0, 0, 0, 0);
  const selected = new Date(date).setHours(0, 0, 0, 0);

  if (selected < today) {
    return res.status(400).json({ message: "Past date not allowed" });
  }

  try {
    const { available, blocked } = await generateSlots(doctorId, date);
    res.json({ available, blocked });
  } catch (err) {
    console.error("Error generating slots:", err);
    res.status(500).json({ message: "Could not generate slots" });
  }
}

/* CREATE */
export async function createAppointment(req, res) {
  try {
    const data = req.body;

    console.log("📥 Received createAppointment request:", JSON.stringify(data));

    const rawTime = (
      data.appointmentTime ||
      data.selectedTime ||
      data.startTime ||
      ""
    ).toString();

    const startLabel = (rawTime.split("-")[0] || rawTime || "00:00").trim();

    const parseLabelToMinutes = (label) => {
      if (!label) return { minutes: 0, formatted: "00:00" };

      const merMatch = label.match(/\b(AM|PM)\b/i);
      let mer = merMatch ? merMatch[1].toUpperCase() : null;

      let t = label;
      if (mer) t = t.replace(/\b(AM|PM)\b/i, "").trim();

      const parts = t.split(":");

      let hours = parseInt(parts[0]) || 0;
      let minutes = parseInt((parts[1] || "0").replace(/\D/g, "")) || 0;

      if (mer) {
        if (mer === "PM" && hours !== 12) hours += 12;
        if (mer === "AM" && hours === 12) hours = 0;
      }

      const formatted = `${hours}:${
        minutes === 0 ? "00" : minutes < 10 ? `0${minutes}` : minutes
      }`;

      return { minutes: hours * 60 + minutes, formatted };
    };

    const parsedStart = parseLabelToMinutes(startLabel);

    data.duration =
      Number(data.duration) ||
      (data.selectedConsultation?.duration
        ? Number(data.selectedConsultation.duration)
        : 120);

    const start = parsedStart.minutes;
    const end = start + Number(data.duration);

    const endHour = Math.floor(end / 60);
    const endMin = end % 60;

    data.endTime = `${endHour}:${
      endMin === 0 ? "00" : endMin < 10 ? `0${endMin}` : endMin
    }`;

    data.startTime = parsedStart.formatted;

    if (rawTime && rawTime.includes("-")) {
      data.appointmentTime = rawTime;
    } else {
      data.appointmentTime = `${startLabel} - ${data.endTime}`;
    }

    data.duration = Number(data.duration || 120);

    const gatewayBase = process.env.API_GATEWAY_URL || "http://localhost:5015";

    // ✅ Fetch doctor details if missing
    const docId = data.doctorId;

    if (
      docId &&
      (!data.doctorName ||
        !data.doctorSpecialty ||
        !data.hospital ||
        !data.doctorEmail ||
        !data.doctorPhone)
    ) {
      try {
        const dresp = await axios.get(`${gatewayBase}/api/doctors/${docId}`, {
          timeout: 5000,
        });

        const d = dresp.data?.data || dresp.data || {};

        data.doctorName =
          data.doctorName || d.fullName || d.name || d.displayName || "";

        data.doctorSpecialty =
          data.doctorSpecialty || d.specialization || d.specialty || "";

        data.hospital =
          data.hospital || d.baseHospital || d.hospital || "";

        data.doctorEmail =
          data.doctorEmail || d.email || d.doctorEmail || "";

        data.doctorPhone =
          data.doctorPhone ||
          d.phone ||
          d.phoneNumber ||
          d.mobile ||
          d.contactNumber ||
          "";
      } catch (err) {
        console.warn(
          "⚠️ Could not fetch doctor details, proceeding with provided data:",
          err?.message || err
        );
      }
    }

    // ✅ Fetch patient details if missing
    if (
      data.patientId &&
      (!data.patientName || !data.patientEmail || !data.patientPhone)
    ) {
      try {
        const pres = await axios.get(
          `${gatewayBase}/api/patients/internal/${data.patientId}`,
          { timeout: 5000 }
        );

        const patient = pres.data?.data || pres.data || {};

        data.patientName =
          data.patientName || patient.name || patient.fullName || "";

        data.patientEmail = data.patientEmail || patient.email || "";

        data.patientPhone =
          data.patientPhone ||
          patient.phone ||
          patient.phoneNumber ||
          patient.mobile ||
          "";

        console.log("✅ Patient details fetched for create:", {
          name: data.patientName,
          email: data.patientEmail,
          phone: data.patientPhone,
        });
      } catch (err) {
        console.warn(
          "⚠️ Could not fetch patient details for create:",
          err?.message || err
        );
      }
  }

    // Duplicate slot check
    if (data.doctorId && data.appointmentDate && data.startTime) {
      try {
        const existingSlot = await Appointment.findOne({
          doctorId: data.doctorId,
          appointmentDate: data.appointmentDate,
          startTime: data.startTime,
          status: { $ne: "CANCELLED" },
        });

        if (existingSlot) {
          if (
            data.patientId &&
            String(existingSlot.patientId) === String(data.patientId)
          ) {
            return res.status(400).json({
              message:
                "Duplicate booking: patient already booked this exact slot",
            });
          }

          return res.status(400).json({
            message: "Time slot already taken for this doctor",
          });
        }
      } catch (err) {
        console.warn("⚠️ Could not validate existing slot:", err?.message || err);
      }
    }

    // Overlap check
    const booked = await Appointment.find({
      doctorId: data.doctorId,
      appointmentDate: data.appointmentDate,
      status: { $ne: "CANCELLED" },
    });

    for (let b of booked) {
      const [bh, bm] = b.startTime.split(":");

      const bStart = parseInt(bh) * 60 + parseInt(bm);
      const bEnd = bStart + b.duration;

      if (start < bEnd && end > bStart) {
        return res.status(400).json({ message: "Time overlap" });
      }
    }

    if (!data.appointmentId) {
      data.appointmentId = `APT_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 6)}`;
    }

    let tries = 0;

    while (tries < 3) {
      const exists = await Appointment.findOne({
        appointmentId: data.appointmentId,
      });

      if (!exists) break;

      data.appointmentId = `${data.appointmentId}_${Math.random()
        .toString(36)
        .substr(2, 4)}`;

      tries++;
    }

    const appointment = await Appointment.create(data);

    res.status(201).json(appointment);
  } catch (err) {
    console.error("❌ Create appointment error:", err);

    if (err && err.name === "ValidationError") {
      const details = {};

      for (const [k, v] of Object.entries(err.errors || {})) {
        details[k] = v.message || String(v);
      }

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details,
      });
    }

    res.status(500).json({
      success: false,
      message: err?.message || "Internal error",
      details: err,
    });
  }
}

/* RESCHEDULE */
export async function rescheduleAppointment(req, res) {
  try {
    const { id } = req.params;
    const { appointmentDate, startTime } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Not found" });
    }

    const targetDate = appointmentDate || appointment.appointmentDate;
    const targetStartTime = startTime || appointment.startTime;
    const duration = appointment.duration;

    const [h = "0", m = "0"] = String(targetStartTime || "00:00").split(":");
    const start = parseInt(h || "0", 10) * 60 + parseInt(m || "0", 10);
    const end = start + duration;

    const endHour = Math.floor(end / 60);
    const endMin = end % 60;

    const paddedMin =
      endMin === 0 ? "00" : endMin < 10 ? `0${endMin}` : String(endMin);

    const endTime = `${endHour}:${paddedMin}`;

    const booked = await Appointment.find({
      _id: { $ne: id },
      doctorId: appointment.doctorId,
      appointmentDate: targetDate,
      status: { $ne: "CANCELLED" },
    });

    for (let b of booked) {
      const [bh, bm] = b.startTime.split(":");

      const bStart = parseInt(bh) * 60 + parseInt(bm);
      const bEnd = bStart + b.duration;

      if (start < bEnd && end > bStart) {
        return res.status(400).json({ message: "Time overlap" });
      }
    }

    appointment.appointmentDate = targetDate;
    appointment.startTime = targetStartTime;
    appointment.endTime = endTime;

    await appointment.save();

    res.status(200).json(appointment);
  } catch (err) {
    console.error("Failed to reschedule appointment:", err);
    res.status(500).json({ message: "Failed to reschedule appointment" });
  }
}

/* PAYMENT */
export async function paymentSuccess(req, res) {
  const { id } = req.params;

  let updated = null;

  try {
    updated = await Appointment.findByIdAndUpdate(
      id,
      {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
      { new: true }
    );
  } catch (err) {
    updated = null;
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
    return res.status(404).json({ message: "Appointment not found" });
  }

  res.json(updated);
}

/* APPROVE */
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
      const gatewayBase = process.env.API_GATEWAY_URL || "http://localhost:5015";

      let patientName = updated.patientName || "";
      let patientEmail = updated.patientEmail || "";
      let patientPhone = updated.patientPhone || "";

      if (updated.patientId && (!patientName || !patientEmail || !patientPhone)) {
        try {
          const pres = await axios.get(
            `${gatewayBase}/api/patients/internal/${updated.patientId}`,
            { timeout: 5000 }
          );

          const patient = pres.data?.data || pres.data || {};

          patientName = patientName || patient.name || patient.fullName || "";
          patientEmail = patientEmail || patient.email || "";
          patientPhone =
            patientPhone ||
            patient.phone ||
            patient.phoneNumber ||
            patient.mobile ||
            "";

          console.log("✅ Patient details fetched for approve:", {
            name: patientName,
            email: patientEmail,
            phone: patientPhone,
          });
        } catch (err) {
          console.warn("⚠️ Could not fetch patient details:", err?.message || err);
        }
      }

      let doctorName = updated.doctorName || "Unknown Doctor";
      let doctorEmail = updated.doctorEmail || "";
      let doctorPhone = updated.doctorPhone || "";
      let doctorSpecialty =
        updated.doctorSpecialty || updated.specialization || "General";

      if (updated.doctorId && (!doctorEmail || !doctorPhone)) {
        try {
          const dres = await axios.get(
            `${gatewayBase}/api/doctors/${updated.doctorId}`,
            { timeout: 5000 }
          );

          const doctor = dres.data?.data || dres.data || {};

          doctorName =
            doctorName ||
            doctor.fullName ||
            doctor.name ||
            doctor.displayName ||
            "Unknown Doctor";

          doctorEmail =
            doctorEmail || doctor.email || doctor.doctorEmail || "";

          doctorPhone =
            doctorPhone ||
            doctor.phone ||
            doctor.phoneNumber ||
            doctor.mobile ||
            doctor.contactNumber ||
            "";

          doctorSpecialty =
            doctorSpecialty ||
            doctor.specialization ||
            doctor.specialty ||
            "General";

          console.log("✅ Doctor details fetched for approve:", {
            name: doctorName,
            email: doctorEmail,
            phone: doctorPhone,
          });
        } catch (err) {
          console.warn("⚠️ Could not fetch doctor details:", err?.message || err);
        }
      }

      // ✅ Save fetched details back to appointment
      try {
        updated = await Appointment.findByIdAndUpdate(
          updated._id,
          {
            patientName: patientName || updated.patientName,
            patientEmail: patientEmail || updated.patientEmail,
            patientPhone: patientPhone || updated.patientPhone,
            doctorEmail: doctorEmail || updated.doctorEmail,
            doctorPhone: doctorPhone || updated.doctorPhone,
          },
          { new: true }
        );
      } catch (upErr) {
        console.warn(
          "⚠️ Could not persist fetched phone/email details:",
          upErr?.message || upErr
        );
      }

      const telemedicinePayload = {
        appointmentId: updated.appointmentId || updated._id.toString(),

        doctorId: updated.doctorId,
        doctorName: doctorName || updated.doctorName || "Unknown Doctor",
        doctorEmail: doctorEmail || updated.doctorEmail || "",
        doctorPhone: doctorPhone || updated.doctorPhone || "",

        patientId: updated.patientId,
        patientName: patientName || updated.patientName || "Patient",
        patientEmail: patientEmail || updated.patientEmail || "",
        patientPhone: patientPhone || updated.patientPhone || "",

        specialty:
          doctorSpecialty ||
          updated.doctorSpecialty ||
          updated.specialization ||
          "General",

        scheduledTime: new Date(updated.appointmentDate),
        appointmentStatus: "CONFIRMED",
        notes: "",
      };

      console.log("Telemedicine payload:", telemedicinePayload);

      const telemedicineResponse = await axios.post(
        `${gatewayBase}/api/telemedicine`,
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
        message:
          "Appointment approved, but telemedicine session creation failed",
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

/* REJECT */
export async function rejectAppointment(req, res) {
  const { id } = req.params;

  const updated = await Appointment.findByIdAndUpdate(
    id,
    { status: "REJECTED" },
    { new: true }
  );

  res.json(updated);
}

/* CANCEL */
export async function cancelAppointment(req, res) {
  const { id } = req.params;

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return res.status(404).json({ message: "Not found" });
  }

  appointment.status = "CANCELLED";

  await appointment.save();

  res.json({ message: "Appointment cancelled" });
}

/* UPDATE PAYMENT SUCCESS */
export async function updatePaymentSuccess(req, res) {
  const { id } = req.params;
  const { orderId, paymentStatus, status, paidAt } = req.body;

  console.log("🔵 Updating appointment payment success:", { id, orderId });

  try {
    let appointment = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
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
      console.error("❌ Appointment not found:", id);

      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    console.log("✅ Appointment updated successfully:", {
      id: appointment.appointmentId,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
    });

    res.json({
      success: true,
      message: "Appointment updated successfully",
      appointment: appointment,
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

/* UPDATE PAYMENT STATUS */
export async function updatePaymentStatus(req, res) {
  const { appointmentId, orderId, paymentStatus, status } = req.body;

  console.log("🔵 Alternative payment status update:", {
    appointmentId,
    orderId,
  });

  try {
    const appointment = await Appointment.findOneAndUpdate(
      { appointmentId: appointmentId },
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

    console.log("✅ Appointment updated via alternative method");

    res.json({
      success: true,
      appointment: appointment,
    });
  } catch (error) {
    console.error("❌ Alternative update error:", error);

    res.status(500).json({
      success: false,
      message: "Error updating appointment",
    });
  }
}

/* MARK PAYMENT FAILED */
export async function markPaymentFailed(req, res) {
  const { id } = req.params;
  const { orderId, statusCode } = req.body;

  try {
    let appointment = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      appointment = await Appointment.findByIdAndUpdate(
        id,
        {
          paymentStatus: "FAILED",
          paymentId: orderId,
          failureReason: `Payment failed with status code: ${statusCode}`,
        },
        { new: true }
      );
    } else {
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

    res.json({ success: true, appointment });
  } catch (error) {
    console.error("Error marking payment failed:", error);
    res.status(500).json({ success: false });
  }
}

/* COMPLETE */
export async function completeAppointment(req, res) {
  const { id } = req.params;
  try {
    let updated = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      updated = await Appointment.findByIdAndUpdate(
        id,
        { status: "COMPLETED" },
        { new: true }
      );
    }

    if (!updated) {
      updated = await Appointment.findOneAndUpdate(
        { appointmentId: id },
        { status: "COMPLETED" },
        { new: true }
      );
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Try to fetch patient and doctor contact info if missing and persist
    try {
      const gatewayBase = process.env.API_GATEWAY_URL || "http://localhost:5015";

      let patientName = updated.patientName || "";
      let patientEmail = updated.patientEmail || "";
      let patientPhone = updated.patientPhone || "";

      if (updated.patientId && (!patientName || !patientEmail || !patientPhone)) {
        try {
          const pres = await axios.get(
            `${gatewayBase}/api/patients/internal/${updated.patientId}`,
            { timeout: 5000 }
          );

          const patient = pres.data?.data || pres.data || {};

          patientName = patientName || patient.name || patient.fullName || "";
          patientEmail = patientEmail || patient.email || "";
          patientPhone =
            patientPhone || patient.phone || patient.phoneNumber || patient.mobile || "";
        } catch (err) {
          console.warn("⚠️ Could not fetch patient details for complete:", err?.message || err);
        }
      }

      let doctorName = updated.doctorName || "Unknown Doctor";
      let doctorEmail = updated.doctorEmail || "";
      let doctorPhone = updated.doctorPhone || "";
      let doctorSpecialty = updated.doctorSpecialty || updated.specialization || "General";

      if (updated.doctorId && (!doctorEmail || !doctorPhone)) {
        try {
          const dres = await axios.get(`${gatewayBase}/api/doctors/${updated.doctorId}`, { timeout: 5000 });
          const doctor = dres.data?.data || dres.data || {};

          doctorName = doctorName || doctor.fullName || doctor.name || doctor.displayName || "Unknown Doctor";
          doctorEmail = doctorEmail || doctor.email || doctor.doctorEmail || "";
          doctorPhone = doctorPhone || doctor.phone || doctor.phoneNumber || doctor.mobile || doctor.contactNumber || "";
          doctorSpecialty = doctorSpecialty || doctor.specialization || doctor.specialty || "General";
        } catch (err) {
          console.warn("⚠️ Could not fetch doctor details for complete:", err?.message || err);
        }
      }

      // Persist contact details if we fetched them
      try {
        updated = await Appointment.findByIdAndUpdate(
          updated._id,
          {
            patientName: patientName || updated.patientName,
            patientEmail: patientEmail || updated.patientEmail,
            patientPhone: patientPhone || updated.patientPhone,
            doctorEmail: doctorEmail || updated.doctorEmail,
            doctorPhone: doctorPhone || updated.doctorPhone,
          },
          { new: true }
        );
      } catch (upErr) {
        console.warn("⚠️ Could not persist fetched phone/email details for complete:", upErr?.message || upErr);
      }

      // Create telemedicine session via API gateway
      try {
        const telemedicinePayload = {
          appointmentId: updated.appointmentId || updated._id.toString(),
          doctorId: updated.doctorId,
          doctorName: doctorName || updated.doctorName || "Unknown Doctor",
          doctorEmail: doctorEmail || updated.doctorEmail || "",
          doctorPhone: doctorPhone || updated.doctorPhone || "",
          patientId: updated.patientId,
          patientName: patientName || updated.patientName || "Patient",
          patientEmail: patientEmail || updated.patientEmail || "",
          patientPhone: patientPhone || updated.patientPhone || "",
          specialty: doctorSpecialty || updated.doctorSpecialty || updated.specialization || "General",
          scheduledTime: new Date(updated.appointmentDate),
          appointmentStatus: "COMPLETED",
          notes: "",
        };

        const gatewayBase = process.env.API_GATEWAY_URL || "http://localhost:5015";

        const telemedicineResponse = await axios.post(
          `${gatewayBase}/api/telemedicine`,
          telemedicinePayload,
          { timeout: 8000 }
        );

        return res.status(200).json({
          success: true,
          message: "Appointment completed and session created successfully",
          appointment: updated,
          telemedicine: telemedicineResponse.data,
        });
      } catch (teleErr) {
        console.error("❌ Telemedicine session creation failed on complete:", teleErr.response?.data || teleErr.message);

        return res.status(500).json({
          success: false,
          message: "Appointment completed, but telemedicine session creation failed",
          appointment: updated,
          telemedicineError: teleErr.response?.data || teleErr.message,
        });
      }
    } catch (err) {
      console.warn("⚠️ Non-critical error in complete flow:", err?.message || err);
      return res.status(200).json({ success: true, appointment: updated });
    }
  } catch (error) {
    console.error("❌ Complete appointment error:", error);
    return res.status(500).json({ success: false, message: "Failed to complete appointment" });
  }
}