import axios from "axios";

const fallbackGatewayHost =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5015`
    : "http://localhost:5015";

const apiHost =
  import.meta.env.VITE_TELEMEDICINE_API_BASE_URL || fallbackGatewayHost;

const telemedicineApi = axios.create({
  baseURL: `${apiHost}/api/telemedicine`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getDoctorSessionsById = async (doctorId) => {
  const response = await telemedicineApi.get(`/doctor/sessions/${doctorId}`);
  return response.data;
};

export const getAllSessions = async () => {
  const response = await telemedicineApi.get("/");
  return response.data;
};

export const getSessionSummary = async () => {
  const response = await telemedicineApi.get("/summary");
  return response.data;
};

export const startSession = async (sessionId) => {
  const response = await telemedicineApi.patch(`/${sessionId}/start`);
  return response.data;
};

export const completeSession = async (sessionId) => {
  const response = await telemedicineApi.patch(`/${sessionId}/complete`);
  return response.data;
};

export default telemedicineApi;