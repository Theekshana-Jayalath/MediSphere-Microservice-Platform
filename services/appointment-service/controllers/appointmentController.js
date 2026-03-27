import Appointment from "../models/appointmentModel.js";
import { generateSlots } from "../service/slotService.js";

/*
SEARCH DOCTORS (filters)
*/
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

/*
GET AVAILABLE SLOTS
*/
export async function getSlots(req, res) {
  const { doctorId, date } = req.query;

  const today = new Date().setHours(0, 0, 0, 0);
  const selected = new Date(date).setHours(0, 0, 0, 0);

  if (selected < today) {
    return res.status(400).json({ message: "Cannot book past dates" });
  }

  const slots = await generateSlots(doctorId, date);

  res.json(slots);
}

/*
CREATE APPOINTMENT
*/
export async function createAppointment(req, res) {
  try {
    const {
      patientId,
      doctorId,
      doctorName,
      specialization,
      hospital,
      appointmentType,
      appointmentDate,
      startTime,
    } = req.body;

    // prevent double booking
    const exists = await Appointment.findOne({
      doctorId,
      appointmentDate,
      startTime,
      status: { $ne: "CANCELLED" },
    });

    if (exists) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      doctorName,
      specialization,
      hospital,
      appointmentType,
      appointmentDate,
      startTime,
    });

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json(err);
  }
}

/*
PAYMENT SUCCESS
*/
export async function paymentSuccess(req, res) {
  const { id } = req.params;

  const updated = await Appointment.findByIdAndUpdate(
    id,
    {
      paymentStatus: "PAID",
      status: "PENDING_DOCTOR_APPROVAL",
    },
    { new: true }
  );

  res.json(updated);
}

/*
DOCTOR APPROVE
*/
export async function approveAppointment(req, res) {
  const { id } = req.params;

  const updated = await Appointment.findByIdAndUpdate(
    id,
    { status: "CONFIRMED" },
    { new: true }
  );

  res.json(updated);
}

/*
DOCTOR REJECT
*/
export async function rejectAppointment(req, res) {
  const { id } = req.params;

  const updated = await Appointment.findByIdAndUpdate(
    id,
    { status: "REJECTED" },
    { new: true }
  );

  res.json(updated);
}