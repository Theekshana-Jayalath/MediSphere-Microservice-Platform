import axios from "axios";

const fallbackGatewayHost =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5015`
    : "http://localhost:5015";

const apiHost = import.meta.env.VITE_TELEMEDICINE_API_BASE_URL || fallbackGatewayHost;

const patientTelemedicineApi = axios.create({
  baseURL: `${apiHost}/api/telemedicine`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getAllSessions = async () => {
  const response = await patientTelemedicineApi.get("/");
  return response.data;
};

export default patientTelemedicineApi;