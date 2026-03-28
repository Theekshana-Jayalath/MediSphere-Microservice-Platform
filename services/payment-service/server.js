import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import paymentRoutes from "./routes/paymentRoutes.js"; 

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`🚀 Payment Service running on port ${PORT}`);
});