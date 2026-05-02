import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  // Human-friendly payment identifier used across services (stable, not Mongo _id)
  paymentId: { type: String, required: true, unique: true, default: () => `PAY_${Date.now()}_${Math.random().toString(36).substr(2,6)}` },
  appointmentId: { type: String, required: true },
  patientId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "LKR" },
  paymentMethod: { type: String, default: "PayHere" },
  status: { type: String, enum: ["PENDING", "PAID", "FAILED" , "REFUNDED"], default: "PAID" },
  transactionId: { type: String },
  contact: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);