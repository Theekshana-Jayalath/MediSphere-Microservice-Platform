import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: String,
    doctorId: String,

    doctorName: String,
    specialization: String,
    hospital: String,

    appointmentType: {
      type: String,
      enum: ["ONLINE", "PHYSICAL"],
    },

    appointmentDate: Date,
    startTime: String,

    status: {
      type: String,
      default: "PENDING_PAYMENT",
    },

    paymentStatus: {
      type: String,
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);