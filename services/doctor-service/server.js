// Force DNS to use Google DNS (required for MongoDB Atlas on Windows)
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "./config/db.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import errorHandler from "./middlewares/errorMiddleware.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentProxyRoutes from "./routes/appointmentProxyRoutes.js";
import reportProxyRoutes from "./routes/reportProxyRoutes.js";
import Doctor from "./models/Doctor.js";
import Counter from "./models/Counter.js";

dotenv.config();

const app = express();

// Allow only frontend origin for security; enable credentials if needed
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, res, next) => {
  console.log("Doctor Service received:", req.method, req.url);
  next();
});

connectDB();


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Doctor Service API is running",
  });
});

app.post("/api/doctors/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const doctor = await Doctor.findOne({ email: String(email).trim().toLowerCase() });

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    let doctorId = doctor.doctorId;

    if (!doctorId) {
      const counter = await Counter.findOneAndUpdate(
        { name: "doctorId" },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }
      );

      doctorId = `DOC${String(counter.seq).padStart(4, "0")}`;

      await Doctor.updateOne(
        { _id: doctor._id },
        { $set: { doctorId } }
      );
    }

    const token = jwt.sign(
      {
        id: doctor._id,
        email: doctor.email,
        role: doctor.role || "doctor",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: doctor._id,
        doctorId,
        name: doctor.fullName,
        email: doctor.email,
        role: doctor.role || "doctor",
        approvalStatus: doctor.approvalStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentProxyRoutes);
app.use("/api/reports", reportProxyRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 6010;

app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});