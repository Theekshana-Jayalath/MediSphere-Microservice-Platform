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

  // booked
  const booked = await Appointment.find({
    doctorId,
    appointmentDate: date,
    status: { $ne: "CANCELLED" },
  });

  let blocked = [];

  booked.forEach(b => {

    const [h, m] = b.startTime.split(":");
    const start = parseInt(h) * 60 + parseInt(m);

    for (let i = 0; i < b.duration; i += 30) {
      const time = start + i;
      const hour = Math.floor(time / 60);
      const min = time % 60;
      blocked.push(`${hour}:${min === 0 ? "00" : "30"}`);
    }

  });

  // Return both available slots and blocked slots so callers can make richer decisions
  const available = slots.filter(s => !blocked.includes(s));

  return { available, blocked };
}