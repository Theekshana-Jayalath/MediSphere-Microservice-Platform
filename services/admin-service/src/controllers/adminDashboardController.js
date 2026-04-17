import axios from "axios";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:5015";

const forwardAuthHeader = (req) => {
  const headers = {};
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  return headers;
};

const extractCount = (data) => {
  if (Array.isArray(data)) return data.length;
  if (typeof data?.count === "number") return data.count;
  if (Array.isArray(data?.data)) return data.data.length;
  return 0;
};

export const getDashboardStats = async (req, res) => {
  try {
    const [doctorsResult, patientsResult, appointmentsResult, revenueResult] =
      await Promise.allSettled([
        axios.get(`${API_GATEWAY_URL}/api/doctors`, {
          headers: forwardAuthHeader(req),
        }),
        axios.get(`${API_GATEWAY_URL}/api/patients`, {
          headers: forwardAuthHeader(req),
        }),
        axios.get(`${API_GATEWAY_URL}/api/appointments`, {
          headers: forwardAuthHeader(req),
        }),
        axios.get(`${API_GATEWAY_URL}/api/payments`, {
          headers: forwardAuthHeader(req),
        }),
      ]);

    const totalDoctors =
      doctorsResult.status === "fulfilled"
        ? extractCount(doctorsResult.value.data)
        : 0;

    const totalPatients =
      patientsResult.status === "fulfilled"
        ? extractCount(patientsResult.value.data)
        : 0;

    const totalAppointments =
      appointmentsResult.status === "fulfilled"
        ? extractCount(appointmentsResult.value.data)
        : 0;

    let totalRevenue = 0;
    if (revenueResult.status === "fulfilled") {
      const paymentData = revenueResult.value.data;

      if (typeof paymentData?.totalRevenue === "number") {
        totalRevenue = paymentData.totalRevenue;
      } else if (Array.isArray(paymentData)) {
        totalRevenue = paymentData.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        );
      } else if (Array.isArray(paymentData?.data)) {
        totalRevenue = paymentData.data.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        );
      }
    }

    return res.status(200).json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalRevenue,
      platformStatistics: {
        doctorService:
          doctorsResult.status === "fulfilled" ? "reachable" : "unreachable",
        patientService:
          patientsResult.status === "fulfilled" ? "reachable" : "unreachable",
        appointmentService:
          appointmentsResult.status === "fulfilled"
            ? "reachable"
            : "unreachable",
        paymentService:
          revenueResult.status === "fulfilled" ? "reachable" : "unreachable",
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};