import axios from "axios";

const apiHost = import.meta.env.VITE_TELEMEDICINE_API_BASE_URL;

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