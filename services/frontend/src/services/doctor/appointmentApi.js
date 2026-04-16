import axios from "axios";

const fallbackDoctorApiBaseUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:6010`
    : "http://localhost:6010";

const normalizeDoctorAppointmentsBaseUrl = (value) => {
  const raw = String(value || "").trim();

  if (!raw) {
    return `${fallbackDoctorApiBaseUrl}/api/appointments`;
  }

  const withoutTrailingSlash = raw.replace(/\/+$/, "");

  if (withoutTrailingSlash.endsWith("/api/doctors")) {
    return withoutTrailingSlash.replace(/\/api\/doctors$/i, "/api/appointments");
  }

  if (withoutTrailingSlash.endsWith("/api")) {
    return `${withoutTrailingSlash}/appointments`;
  }

  return `${withoutTrailingSlash}/api/appointments`;
};

let appointmentApi = axios.create({
  baseURL: normalizeDoctorAppointmentsBaseUrl(import.meta.env.VITE_DOCTOR_API_BASE_URL),
  headers: {
    "Content-Type": "application/json",
  },
});

appointmentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let getAllAppointments = async (doctorId = "") => {
  const query = doctorId ? { params: { doctorId } } : undefined;
  let response = await appointmentApi.get("/", query);
  return response.data;
};

let getAppointmentsByDoctorId = async (doctorId) => {
  let response = await appointmentApi.get(`/doctor/${doctorId}`);
  return response.data;
};

let createAppointment = async (appointmentData) => {
  let response = await appointmentApi.post("/", appointmentData);
  return response.data;
};

let updateAppointmentStatus = async (appointmentId, status) => {
  let response = await appointmentApi.patch(`/${appointmentId}/status`, {
    status,
  });
  return response.data;
};

export {
  getAllAppointments,
  getAppointmentsByDoctorId,
  createAppointment,
  updateAppointmentStatus,
};

export default appointmentApi;