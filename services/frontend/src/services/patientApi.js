import axios from "axios";

const patientApi = axios.create({
  baseURL: "http://localhost:5015/api/patients",
});

patientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getMyPatientProfile = () => patientApi.get("/me");
export const updateMyPatientProfile = (data) => patientApi.put("/me", data);

export default patientApi;