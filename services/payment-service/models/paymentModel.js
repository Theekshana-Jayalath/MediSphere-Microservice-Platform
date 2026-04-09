import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },   // added
  appointmentId: { type: String, required: true },
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "LKR" },
  paymentMethod: { type: String, default: "PayHere" },
  status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
  transactionId: { type: String },
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);