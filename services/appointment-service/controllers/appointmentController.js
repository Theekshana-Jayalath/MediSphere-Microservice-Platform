import Appointment from "../models/appointmentModel.js";
import { generateSlots } from "../service/slotService.js";

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

    // calculate end time
    const [h,m] = data.startTime.split(":");
    const start = parseInt(h) * 60 + parseInt(m);
    const end = start + data.duration;

    const endHour = Math.floor(end / 60);
    const endMin = end % 60;

    data.endTime = `${endHour}:${endMin === 0 ? "00" : "30"}`;

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

    const appointment = await Appointment.create(data);

    res.status(201).json(appointment);

  } catch (err) {
    res.status(500).json(err);
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