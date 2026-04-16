import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import adminDoctorRoutes from "./routes/adminDoctorRoutes.js";
import adminPatientRoutes from "./routes/adminPatientRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Admin Service is running...");
});

app.use("/api/admin/doctors", adminDoctorRoutes);
app.use("/api/admin/patients", adminPatientRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);

const PORT = process.env.PORT || 5008;

app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`);
});