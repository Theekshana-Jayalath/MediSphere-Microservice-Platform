import axios from "axios";

let API_BASE_URL = "http://localhost:5002/api/doctors";

let registerDoctor = async (doctorData) => {
  let response = await axios.post(`${API_BASE_URL}/register`, doctorData);
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