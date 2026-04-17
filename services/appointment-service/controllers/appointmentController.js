import axios from "axios";
import Appointment from "../models/appointmentModel.js";
import { generateSlots } from "../service/slotService.js";

const enrichAppointmentsWithPatientDisplayId = async (appointments) => {
  const appointmentList = Array.isArray(appointments) ? appointments : [appointments];

  const enriched = await Promise.all(
    appointmentList.map(async (appointment) => {
      try {
        const patientRes = await axios.get(
          `${process.env.PATIENT_SERVICE_URL}/api/patients/internal/${appointment.patientId}`
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

/* LIST */
export async function getAllAppointments(req, res) {
  try {
    const appointments = await Appointment.find({}).sort({ createdAt: -1 });
    return res.json(appointments);
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    return res.status(500).json({ message: "Failed to fetch appointments" });
  }
}

/* BY PATIENT */
export async function getAppointmentsByPatient(req, res) {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({ patientId }).sort({
      appointmentDate: -1,
      startTime: -1,
    });

    return res.json(appointments);
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    return res.status(500).json({ message: "Failed to fetch patient appointments" });
  }
}

/* RESCHEDULE */
export async function rescheduleAppointment(req, res) {
  try {
    const { id } = req.params;
    const { appointmentDate, startTime, duration } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointmentDate !== undefined) appointment.appointmentDate = appointmentDate;
    if (startTime !== undefined) appointment.startTime = startTime;
    if (duration !== undefined) appointment.duration = Number(duration);

    if (appointment.startTime && appointment.duration) {
      const [h = "0", m = "0"] = String(appointment.startTime).split(":");
      const start = parseInt(h, 10) * 60 + parseInt(m, 10);
      const end = start + Number(appointment.duration);
      const endHour = Math.floor(end / 60);
      const endMinute = end % 60;
      appointment.endTime = `${endHour}:${endMinute === 0 ? "00" : (endMinute < 10 ? `0${endMinute}` : endMinute)}`;
    }

    await appointment.save();
    return res.json(appointment);
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return res.status(500).json({ message: "Failed to reschedule appointment" });
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

  const today = new Date().setHours(0,0,0,0);
  const selected = new Date(date).setHours(0,0,0,0);

  if (selected < today) {
    return res.status(400).json({ message: "Past date not allowed" });
  }

  const slots = await generateSlots(doctorId, date);

  res.json(slots);
}

/* CREATE */
export async function createAppointment(req, res) {

  try {
  const data = req.body;
  console.log("📥 Received createAppointment request:", JSON.stringify(data));

    // Ensure required timing fields exist and are normalized
    data.startTime = data.startTime || data.appointmentTime || "00:00";
    data.duration = Number(data.duration) || (data.selectedConsultation?.duration ? Number(data.selectedConsultation.duration) : 30);

    // Safely parse startTime (format HH:MM)
    const [h = "0", m = "0"] = String(data.startTime).split(":");
    const start = parseInt(h) * 60 + parseInt(m);
    const end = start + Number(data.duration);

    const endHour = Math.floor(end / 60);
    const endMin = end % 60;

    data.endTime = `${endHour}:${endMin === 0 ? "00" : (endMin < 10 ? `0${endMin}` : endMin)}`;

    // If doctor related display fields are missing, try to fetch from Doctor Service
    const docId = data.doctorId;
    if (docId && (!data.doctorName || !data.doctorSpecialty || !data.hospital)) {
      const doctorServiceBase = process.env.DOCTOR_SERVICE_URL || "http://localhost:6010";
      try {
        const dresp = await axios.get(`${doctorServiceBase}/api/doctors/${docId}`, { timeout: 5000 });
        const d = dresp.data;
        if (d) {
          data.doctorName = data.doctorName || d.fullName || d.name || d.displayName || "";
          data.doctorSpecialty = data.doctorSpecialty || d.specialization || d.specialty || "";
          data.hospital = data.hospital || d.baseHospital || d.hospital || "";
        }
      } catch (err) {
        // Non-fatal: continue with whatever data is available
        console.warn("⚠️ Could not fetch doctor details, proceeding with provided data:", err?.message || err);
      }
    }

    // Prevent duplicate bookings:
    // - same doctor, same date, same startTime -> slot already taken
    // - same doctor, same date, same startTime, same patient -> duplicate booking by same patient
    if (data.doctorId && data.appointmentDate && data.startTime) {
      try {
        const existingSlot = await Appointment.findOne({
          doctorId: data.doctorId,
          appointmentDate: data.appointmentDate,
          startTime: data.startTime,
          status: { $ne: "CANCELLED" }
        });

        if (existingSlot) {
          if (data.patientId && String(existingSlot.patientId) === String(data.patientId)) {
            return res.status(400).json({ message: "Duplicate booking: patient already booked this exact slot" });
          }
          return res.status(400).json({ message: "Time slot already taken for this doctor" });
        }
      } catch (err) {
        console.warn("⚠️ Could not validate existing slot:", err?.message || err);
      }
    }

    // overlap check
    const booked = await Appointment.find({
      doctorId: data.doctorId,
      appointmentDate: data.appointmentDate,
      status: { $ne: "CANCELLED" }
    });

    for (let b of booked) {

      const [bh,bm] = b.startTime.split(":");
      const bStart = parseInt(bh)*60 + parseInt(bm);
      const bEnd = bStart + b.duration;

      if (start < bEnd && end > bStart) {
        return res.status(400).json({ message: "Time overlap" });
      }
    }

    // Ensure unique appointmentId - if missing or duplicate, generate a new one
    if (!data.appointmentId) data.appointmentId = `APT_${Date.now()}_${Math.random().toString(36).substr(2,6)}`;
    // If appointmentId already exists, append suffix until unique
    let tries = 0;
    while (tries < 3) {
      const exists = await Appointment.findOne({ appointmentId: data.appointmentId });
      if (!exists) break;
      data.appointmentId = `${data.appointmentId}_${Math.random().toString(36).substr(2,4)}`;
      tries++;
    }

    const appointment = await Appointment.create(data);

    res.status(201).json(appointment);

  } catch (err) {
    console.error("❌ Create appointment error:", err);
    // Format validation errors
    if (err && err.name === 'ValidationError') {
      const details = {};
      for (const [k,v] of Object.entries(err.errors || {})) details[k] = v.message || String(v);
      return res.status(400).json({ success: false, message: 'Validation failed', details });
    }
    res.status(500).json({ success: false, message: err?.message || 'Internal error', details: err });
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

    const [h, m] = targetStartTime.split(":");
    const start = parseInt(h) * 60 + parseInt(m);
    const end = start + duration;

    const endHour = Math.floor(end / 60);
    const endMin = end % 60;
    const endTime = `${endHour}:${endMin === 0 ? "00" : "30"}`;

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
export async function paymentSuccess(req,res){

  const { id } = req.params;

  // Try update by MongoDB _id first
  let updated = null;
  try {
    updated = await Appointment.findByIdAndUpdate(
      id,
      {
        paymentStatus: "PAID",
        status: "PENDING_DOCTOR_APPROVAL"
      },
      { new: true }
    );
  } catch (err) {
    // ignore and try by appointmentId
    updated = null;
  }

  if (!updated) {
    // Try update by appointmentId field
    updated = await Appointment.findOneAndUpdate(
      { appointmentId: id },
      {
        paymentStatus: "PAID",
        status: "PENDING_DOCTOR_APPROVAL"
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
export async function approveAppointment(req,res){

  const { id } = req.params;

  const updated = await Appointment.findByIdAndUpdate(
    id,
    { status:"CONFIRMED" },
    { new:true }
  );

  res.json(updated);
}

/* REJECT */
export async function rejectAppointment(req,res){

  const { id } = req.params;

  const updated = await Appointment.findByIdAndUpdate(
    id,
    { status:"REJECTED" },
    { new:true }
  );

  res.json(updated);
}

/* CANCEL */
export async function cancelAppointment(req,res){

  const { id } = req.params;

  const appointment = await Appointment.findById(id);

  if(!appointment){
    return res.status(404).json({message:"Not found"})
  }

  appointment.status = "CANCELLED";

  await appointment.save();

  res.json({ message:"Appointment cancelled" });
}

// In appointmentController.js - Add these functions

// Update appointment after successful payment
export async function updatePaymentSuccess(req, res) {
  const { id } = req.params;
  const { orderId, paymentStatus, status, paidAt } = req.body;

  console.log("🔵 Updating appointment payment success:", { id, orderId });

  try {
    let appointment = null;
    
    // Try to find by MongoDB _id first
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      appointment = await Appointment.findByIdAndUpdate(
        id,
        {
          paymentStatus: paymentStatus || "PAID",
          status: status || "CONFIRMED",
          paymentId: orderId,
          paidAt: paidAt || new Date()
        },
        { new: true }
      );
    }
    
    // If not found, try by appointmentId
    if (!appointment) {
      appointment = await Appointment.findOneAndUpdate(
        { appointmentId: id },
        {
          paymentStatus: paymentStatus || "PAID",
          status: status || "CONFIRMED",
          paymentId: orderId,
          paidAt: paidAt || new Date()
        },
        { new: true }
      );
    }

    if (!appointment) {
      console.error("❌ Appointment not found:", id);
      return res.status(404).json({ 
        success: false, 
        message: "Appointment not found" 
      });
    }

    console.log("✅ Appointment updated successfully:", {
      id: appointment.appointmentId,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus
    });

    res.json({
      success: true,
      message: "Appointment updated successfully",
      appointment: appointment
    });

  } catch (error) {
    console.error("❌ Update payment success error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating appointment",
      error: error.message 
    });
  }
}

// Alternative update endpoint
export async function updatePaymentStatus(req, res) {
  const { appointmentId, orderId, paymentStatus, status } = req.body;

  console.log("🔵 Alternative payment status update:", { appointmentId, orderId });

  try {
    const appointment = await Appointment.findOneAndUpdate(
      { appointmentId: appointmentId },
      {
        paymentStatus: paymentStatus || "PAID",
        status: status || "CONFIRMED",
        paymentId: orderId,
        paidAt: new Date()
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: "Appointment not found" 
      });
    }

    console.log("✅ Appointment updated via alternative method");

    res.json({
      success: true,
      appointment: appointment
    });

  } catch (error) {
    console.error("❌ Alternative update error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating appointment" 
    });
  }
}

// Mark payment as failed
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
          failureReason: `Payment failed with status code: ${statusCode}`
        },
        { new: true }
      );
    } else {
      appointment = await Appointment.findOneAndUpdate(
        { appointmentId: id },
        {
          paymentStatus: "FAILED",
          paymentId: orderId,
          failureReason: `Payment failed with status code: ${statusCode}`
        },
        { new: true }
      );
    }

    res.json({ success: true });

  } catch (error) {
    console.error("Error marking payment failed:", error);
    res.status(500).json({ success: false });
  }
}