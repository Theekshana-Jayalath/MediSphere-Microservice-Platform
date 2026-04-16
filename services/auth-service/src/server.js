// Force DNS to use Google DNS (required for MongoDB Atlas on Windows)
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Auth Service is running 🚀");
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});