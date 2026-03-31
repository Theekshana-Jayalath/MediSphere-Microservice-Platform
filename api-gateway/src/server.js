import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("API Gateway is running 🚀");
});

app.use(
  "/api/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
  })
);

app.use(
  "/api/patients",
  createProxyMiddleware({
    target: process.env.PATIENT_SERVICE_URL,
    changeOrigin: true,
  })
);

app.use(
  "/api/reports",
  createProxyMiddleware({
    target: process.env.PATIENT_SERVICE_URL,
    changeOrigin: true,
  })
);

const PORT = process.env.PORT || 5015;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});