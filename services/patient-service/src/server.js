// Force DNS to use Google DNS (required for MongoDB Atlas on Windows)
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import patientRoutes from "./routes/patientRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const uploadDir = path.join(currentDir, "uploads");
const legacyUploadDir = path.join(currentDir, "..", "uploads");

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads from both possible locations for backward compatibility
app.use("/uploads", express.static(uploadDir));
app.use("/uploads", express.static(legacyUploadDir));
// Also serve from src/uploads as fallback (from patient-service branch)
app.use("/uploads", express.static(path.join(process.cwd(), "src", "uploads")));

app.get("/", (req, res) => {
  res.send("Patient Service is running 🚀");
});

app.use("/api/patients", patientRoutes);
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});