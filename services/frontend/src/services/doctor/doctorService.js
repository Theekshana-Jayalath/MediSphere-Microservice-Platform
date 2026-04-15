import axios from "axios";

let fallbackDoctorServiceHost =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:6010`
    : "http://localhost:6010";

let doctorServiceHost =
  import.meta.env.VITE_DOCTOR_SERVICE_URL || fallbackDoctorServiceHost;

let API_BASE_URL = `${doctorServiceHost}/api/doctors`;

let registerDoctor = async (doctorData) => {
  let response = await axios.post(`${API_BASE_URL}/register`, doctorData, {
    timeout: 15000,
  });
  return response.data;
};

let getDoctorById = async (doctorId) => {
  let response = await axios.get(`${API_BASE_URL}/${doctorId}`);
  return response.data;
};

let getDoctorApprovalStatus = async (doctorId) => {
  let response = await axios.get(`${API_BASE_URL}/status/${doctorId}`);
  return response.data;
};

export { registerDoctor, getDoctorById, getDoctorApprovalStatus };