import Appointment from "../models/appointmentModel.js";
import { generateSlots } from "../service/slotService.js";
import axios from "axios";

const normalizeAppointmentTime = (appointment) => {
  return (
    appointment?.appointmentTime ||
    appointment?.startTime ||
    "00:00"
  );
};

const sortAppointmentsDesc = (appointments) => {
  return [...appointments].sort(
    (left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
  );
};

/* LIST ALL */
export async function getAllAppointments(req, res) {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/* LIST BY PATIENT */
export async function getAppointmentsByPatient(req, res) {
  try {
    const appointments = await Appointment.find({ patientId: req.params.patientId }).sort({
      createdAt: -1,
    });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

  res.json(results);
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

/* PAYMENT */
export async function paymentSuccess(req,res){

  const { id } = req.params;

  const updated = await Appointment.findByIdAndUpdate(
    id,
    {
      paymentStatus:"PAID",
      status:"PENDING_DOCTOR_APPROVAL"
    },
    { new:true }
  );

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

/* RESCHEDULE */
export async function rescheduleAppointment(req, res) {
  try {
    const { id } = req.params;
    const { appointmentDate, appointmentTime, startTime, status } = req.body;

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        ...(appointmentDate !== undefined ? { appointmentDate } : {}),
        ...(appointmentTime !== undefined ? { appointmentTime } : {}),
        ...(startTime !== undefined ? { startTime } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}