import axios from "axios";

let appointmentApi = axios.create({
  baseURL: import.meta.env.VITE_DOCTOR_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let getAllAppointments = async () => {
  let response = await appointmentApi.get("/appointments");
  return response.data;
};

let getAppointmentsByDoctorId = async (doctorId) => {
  let response = await appointmentApi.get(`/appointments/doctor/${doctorId}`);
  return response.data;
};

let createAppointment = async (appointmentData) => {
  let response = await appointmentApi.post("/appointments", appointmentData);
  return response.data;
};

let updateAppointmentStatus = async (appointmentId, status) => {
  let response = await appointmentApi.patch(`/appointments/${appointmentId}/status`, {
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