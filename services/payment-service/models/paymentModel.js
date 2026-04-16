// models/paymentModel.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  appointmentId: { type: String, required: true },
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "LKR" },
  paymentMethod: { type: String, default: "PayHere" },
  status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
  transactionId: { type: String },
  contact: { type: String },
  bookingDetails: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);