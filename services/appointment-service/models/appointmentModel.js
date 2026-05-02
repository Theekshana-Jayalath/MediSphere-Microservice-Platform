import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },

  patientId: { type: String, required: true },

  // ✅ PATIENT DETAILS
  patientName: { type: String },
  patientEmail: { type: String },
  patientPhone: { type: String },

  // ✅ DOCTOR DETAILS
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  doctorSpecialty: { type: String, required: true },
  hospital: { type: String, required: true },

  // ✅ ADD THIS (IMPORTANT)
  doctorPhone: { type: String, default: "" },

  // (optional but recommended for notification)
  doctorEmail: { type: String, default: "" },

  appointmentDate: { type: String, required: true },

  // legacy field kept for compatibility
  appointmentTime: { type: String, required: true },

  // timing
  startTime: { type: String },
  endTime: { type: String },
  duration: { type: Number, default: 120 },

  consultationType: { type: String },
  amount: { type: Number, required: true },

  paymentId: { type: String },

  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"],
    default: "PENDING",
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Appointment", appointmentSchema);