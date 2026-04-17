import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

app.use(cors());

// Keep JSON parsing for normal requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("Gateway received:", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send("API Gateway is running 🚀");
});

const forwardRequest = async (req, res, targetBaseUrl) => {
  try {
    const targetUrl = `${targetBaseUrl}${req.originalUrl}`;

    const headers = {
      ...(req.headers.authorization
        ? { Authorization: req.headers.authorization }
        : {}),
      ...(req.headers["content-type"]
        ? { "Content-Type": req.headers["content-type"] }
        : {}),
    };

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers,
      validateStatus: () => true,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Gateway forward error:", error.message);
    return res.status(500).json({
      message: "Gateway forwarding failed",
      error: error.message,
    });
  }
};

// Special forwarder for multipart/form-data uploads
const forwardMultipartRequest = async (req, res, targetBaseUrl) => {
  try {
    const targetUrl = `${targetBaseUrl}${req.originalUrl}`;

    const headers = {
      ...(req.headers.authorization
        ? { Authorization: req.headers.authorization }
        : {}),
      ...(req.headers["content-type"]
        ? { "Content-Type": req.headers["content-type"] }
        : {}),
    };

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req,
      headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      responseType: "json",
      validateStatus: () => true,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Gateway multipart forward error:", error.message);
    return res.status(500).json({
      message: "Gateway forwarding failed",
      error: error.message,
    });
  }
};

// Get doctors that the patient has appointments with
app.get("/api/doctors/my-doctors/:patientId", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { patientId } = req.params;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    console.log("Fetching patient's doctors from appointment service");

    const appointmentsResponse = await axios({
      method: "GET",
      url: `${process.env.APPOINTMENT_SERVICE_URL}/api/appointments/patient/${patientId}`,
      headers: {
        Authorization: token,
      },
      validateStatus: () => true,
    });

    if (appointmentsResponse.status !== 200) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const appointments =
      appointmentsResponse.data.data || appointmentsResponse.data || [];

    const doctorIds = [
      ...new Set(appointments.map((apt) => apt.doctorId).filter((id) => id)),
    ];

    if (doctorIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const doctorPromises = doctorIds.map(async (doctorId) => {
      const doctorResponse = await axios({
        method: "GET",
        url: `${process.env.DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`,
        validateStatus: () => true,
      });

      if (doctorResponse.status === 200 && doctorResponse.data) {
        const doctor = doctorResponse.data.data || doctorResponse.data;
        return {
          _id: doctor._id,
          fullName: doctor.fullName,
          specialization: doctor.specialization,
          consultationFee: doctor.consultationFee,
          experienceYears: doctor.experienceYears,
          photo: doctor.photo,
          baseHospital: doctor.baseHospital,
        };
      }
      return null;
    });

    const doctors = (await Promise.all(doctorPromises)).filter(
      (d) => d !== null
    );

    console.log(`Found ${doctors.length} doctors for this patient`);
    return res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching patient's doctors:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      data: [],
    });
  }
});

app.use("/api/auth", (req, res) =>
  forwardRequest(req, res, process.env.AUTH_SERVICE_URL)
);

app.use("/api/patients", (req, res) =>
  forwardRequest(req, res, process.env.PATIENT_SERVICE_URL)
);

// Use multipart forwarder for reports upload/update requests with files
app.use("/api/reports", (req, res) => {
  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("multipart/form-data")) {
    return forwardMultipartRequest(req, res, process.env.PATIENT_SERVICE_URL);
  }

  return forwardRequest(req, res, process.env.PATIENT_SERVICE_URL);
});

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

const PORT = process.env.PORT || 5015;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});