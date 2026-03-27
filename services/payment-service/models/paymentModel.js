import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  appointmentId: String,
  patientId: String,
  amount: Number,
  status: {
    type: String,
    default: "pending"
  },
  paymentMethod: String,
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);