import axios from "axios";

let availabilityApi = axios.create({
  baseURL: import.meta.env.VITE_DOCTOR_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let getAllAvailability = async () => {
  let response = await availabilityApi.get("/availability");
  return response.data;
};

let getAvailabilityByDoctorId = async (doctorId) => {
  let response = await availabilityApi.get(`/availability/doctor/${doctorId}`);
  return response.data;
};

let addAvailability = async (availabilityData) => {
  let response = await availabilityApi.post("/availability", availabilityData);
  return response.data;
};

let updateAvailability = async (availabilityId, updatedData) => {
  let response = await availabilityApi.put(`/availability/${availabilityId}`, updatedData);
  return response.data;
};

let deleteAvailability = async (availabilityId) => {
  let response = await availabilityApi.delete(`/availability/${availabilityId}`);
  return response.data;
};

export {
  getAllAvailability,
  getAvailabilityByDoctorId,
  addAvailability,
  updateAvailability,
  deleteAvailability,
};

export default availabilityApi;