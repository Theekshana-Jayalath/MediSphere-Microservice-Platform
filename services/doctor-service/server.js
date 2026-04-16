// Force DNS to use Google DNS (required for MongoDB Atlas on Windows)
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import errorHandler from "./middlewares/errorMiddleware.js";
import doctorRoutes from "./routes/doctorRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Doctor Service API is running",
  });
});

app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/doctors", doctorRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 6010;

app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});