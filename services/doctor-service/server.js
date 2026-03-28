import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

const PORT = process.env.PORT || 6010;

app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});