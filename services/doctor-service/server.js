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
import Doctor from "./models/Doctor.js";

dotenv.config();

const app = express();

app.use(cors());
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

app.use(errorHandler);

const PORT = process.env.PORT || 6010;

app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});