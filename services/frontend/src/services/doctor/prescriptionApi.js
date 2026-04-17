import axios from "axios";

const STORAGE_KEY = "medisphere_prescriptions";
const doctorServiceUrl =
  import.meta.env.VITE_DOCTOR_SERVICE_URL || "http://localhost:6010";

const API = axios.create({
  baseURL: `${doctorServiceUrl}/api/prescriptions`,
});

const canUseLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readLocalPrescriptions = () => {
  if (!canUseLocalStorage()) return [];

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const writeLocalPrescriptions = (prescriptions) => {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));
};

const isNetworkError = (error) => !error.response;

const sortByNewest = (prescriptions) =>
  [...prescriptions].sort(
    (a, b) =>
      new Date(b.createdAt || b.issuedDate || 0) -
      new Date(a.createdAt || a.issuedDate || 0)
  );

const createLocalPrescriptionRecord = (prescriptionData) => ({
  ...prescriptionData,
  _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  issuedDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const getAllPrescriptions = async () => {
  try {
    const response = await API.get("/");
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      const data = sortByNewest(readLocalPrescriptions());
      return {
        success: true,
        count: data.length,
        data,
        source: "local",
      };
    }

    throw error;
  }
};

export const getPrescriptionById = async (id) => {
  try {
    const response = await API.get(`/${id}`);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      const prescription = readLocalPrescriptions().find((item) => item._id === id);
      return {
        success: Boolean(prescription),
        data: prescription || null,
      };
    }

    throw error;
  }
};

export const getPrescriptionsByDoctor = async (doctorId) => {
  try {
    const response = await API.get(`/doctor/${doctorId}`);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      const data = sortByNewest(
        readLocalPrescriptions().filter((item) => item.doctorId === doctorId)
      );

      return {
        success: true,
        count: data.length,
        data,
        source: "local",
      };
    }

    throw error;
  }
};

export const getPrescriptionsByPatient = async (patientId) => {
  try {
    const response = await API.get(`/patient/${patientId}`);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      const data = sortByNewest(
        readLocalPrescriptions().filter((item) => item.patientId === patientId)
      );

      return {
        success: true,
        count: data.length,
        data,
        source: "local",
      };
    }

    throw error;
  }
};

export const createPrescription = async (prescriptionData) => {
  try {
    const response = await API.post("/", prescriptionData);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      const localPrescription = createLocalPrescriptionRecord(prescriptionData);
      const existingPrescriptions = readLocalPrescriptions();

      writeLocalPrescriptions([localPrescription, ...existingPrescriptions]);

      return {
        success: true,
        message:
          "Prescription saved locally. Start the doctor service to store it in the backend.",
        data: localPrescription,
        source: "local",
      };
    }

    throw error;
  }
};

export const updatePrescription = async (id, updatedData) => {
  try {
    const response = await API.put(`/${id}`, updatedData);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      const updatedPrescriptions = readLocalPrescriptions().map((item) =>
        item._id === id
          ? {
              ...item,
              ...updatedData,
              updatedAt: new Date().toISOString(),
            }
          : item
      );

      writeLocalPrescriptions(updatedPrescriptions);

      const updatedPrescription = updatedPrescriptions.find((item) => item._id === id);

      return {
        success: Boolean(updatedPrescription),
        message: updatedPrescription
          ? "Prescription updated locally"
          : "Prescription not found",
        data: updatedPrescription || null,
        source: "local",
      };
    }

    throw error;
  }
};

export const deletePrescription = async (id) => {
  try {
    const response = await API.delete(`/${id}`);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      const existingPrescriptions = readLocalPrescriptions();
      const filteredPrescriptions = existingPrescriptions.filter(
        (item) => item._id !== id
      );

      writeLocalPrescriptions(filteredPrescriptions);

      return {
        success: filteredPrescriptions.length !== existingPrescriptions.length,
        message: "Prescription deleted locally",
        source: "local",
      };
    }

    throw error;
  }
};