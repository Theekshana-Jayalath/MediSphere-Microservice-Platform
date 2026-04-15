import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("Gateway received:", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send("API Gateway is running 🚀");
});

const forwardRequest = async (req, res, targetBaseUrl) => {
  try {
    if (!targetBaseUrl) {
      return res.status(500).json({
        success: false,
        message: "Target service URL is not configured in API Gateway .env",
      });
    }

    const targetUrl = `${targetBaseUrl}${req.originalUrl}`;

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        ...(req.headers.authorization
          ? { Authorization: req.headers.authorization }
          : {}),
        ...(req.headers["content-type"]
          ? { "Content-Type": req.headers["content-type"] }
          : {}),
      },
      validateStatus: () => true,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Gateway forward error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gateway forwarding failed",
      error: error.message,
    });
  }
};

app.use("/api/auth", (req, res) =>
  forwardRequest(req, res, process.env.AUTH_SERVICE_URL)
);

app.use("/api/patients", (req, res) =>
  forwardRequest(req, res, process.env.PATIENT_SERVICE_URL)
);

app.use("/api/reports", (req, res) =>
  forwardRequest(req, res, process.env.PATIENT_SERVICE_URL)
);

app.use("/api/doctors", (req, res) =>
  forwardRequest(req, res, process.env.DOCTOR_SERVICE_URL)
);

app.use("/api/appointments", (req, res) =>
  forwardRequest(req, res, process.env.APPOINTMENT_SERVICE_URL)
);

app.use("/api/payments", (req, res) =>
  forwardRequest(req, res, process.env.PAYMENT_SERVICE_URL)
);

app.use("/api/admin", (req, res) =>
  forwardRequest(req, res, process.env.ADMIN_SERVICE_URL)
);

// ✅ Add Telemedicine
app.use("/api/telemedicine", (req, res) =>
  forwardRequest(req, res, process.env.TELEMEDICINE_SERVICE_URL)
);

// ✅ Add Notification
app.use("/api/notifications", (req, res) =>
  forwardRequest(req, res, process.env.NOTIFICATION_SERVICE_URL)
);

const PORT = process.env.PORT || 5015;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});