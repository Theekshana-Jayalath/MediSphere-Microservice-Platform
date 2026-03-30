import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:6010/api/prescriptions",
});

export const getAllPrescriptions = async () => {
  const response = await API.get("/");
  return response.data;
};

export const getPrescriptionById = async (id) => {
  const response = await API.get(`/${id}`);
  return response.data;
};

export const getPrescriptionsByDoctor = async (doctorId) => {
  const response = await API.get(`/doctor/${doctorId}`);
  return response.data;
};

export const getPrescriptionsByPatient = async (patientId) => {
  const response = await API.get(`/patient/${patientId}`);
  return response.data;
};

export const createPrescription = async (prescriptionData) => {
  const response = await API.post("/", prescriptionData);
  return response.data;
};

export const updatePrescription = async (id, updatedData) => {
  const response = await API.put(`/${id}`, updatedData);
  return response.data;
};

export const deletePrescription = async (id) => {
  const response = await API.delete(`/${id}`);
  return response.data;
};