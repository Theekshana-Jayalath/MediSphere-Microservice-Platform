import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },

  // ✅ ADD THESE 3 FIELDS
  patientName: { type: String, },
  patientEmail: { type: String, },
  phoneNumber: { type: String,  },

  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  doctorSpecialty: { type: String, required: true },
  hospital: { type: String, required: true },
  appointmentDate: { type: String, required: true },
  appointmentTime: { type: String, required: true },
  consultationType: { type: String },
  amount: { type: Number, required: true },
  paymentId: { type: String },
  status: { 
    type: String, 
    enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"], 
    default: "PENDING" 
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Appointment", appointmentSchema);