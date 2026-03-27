import Appointment from "../models/appointmentModel.js";

export async function generateSlots(doctorId, date) {
  let slots = [];

  for (let i = 9; i <= 17; i++) {
    slots.push(`${i}:00`);
    slots.push(`${i}:30`);
  }

  const now = new Date();
  const selected = new Date(date);

  // remove past time
  if (selected.toDateString() === now.toDateString()) {
    slots = slots.filter((slot) => {
      const [h, m] = slot.split(":");
      const slotTime = new Date();
      slotTime.setHours(h, m);
      return slotTime > now;
    });
  }

  // remove booked slots
  const booked = await Appointment.find({
    doctorId,
    appointmentDate: date,
    status: { $ne: "CANCELLED" },
  });

  const bookedTimes = booked.map((b) => b.startTime);

  return slots.filter((s) => !bookedTimes.includes(s));
}