import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/appointments", appointmentRoutes);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`🚀 Appointment Service running on port ${PORT}`);
});