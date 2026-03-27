import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
{
  patientId: { type: String, required: true },

  doctorId: { type: String, required: true },

  doctorName: { type: String, required: true },

  specialization: { type: String, required: true },

  hospital: { type: String, required: true },

  appointmentType: {
    type: String,
    enum: ["ONLINE", "PHYSICAL"],
    required: true
  },

  appointmentDate: {
    type: Date,
    required: true
  },

  startTime: {
    type: String,
    required: true
  },

  duration: {
    type: Number,
    enum: [60, 120],
    required: true
  },

  endTime: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: [
      "PENDING_PAYMENT",
      "PENDING_DOCTOR_APPROVAL",
      "CONFIRMED",
      "REJECTED",
      "CANCELLED"
    ],
    default: "PENDING_PAYMENT"
  },

  paymentStatus: {
    type: String,
    enum: ["PENDING", "PAID"],
    default: "PENDING"
  }

},
{ timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);