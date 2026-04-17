import axios from "axios";

const fallbackDoctorApiBaseUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:6010`
    : "http://localhost:6010";

const normalizeDoctorReportBaseUrl = (value) => {
  const raw = String(value || "").trim();

  if (!raw) {
    return `${fallbackDoctorApiBaseUrl}/api/reports`;
  }

  const withoutTrailingSlash = raw.replace(/\/+$/, "");

  if (withoutTrailingSlash.endsWith("/api/doctors")) {
    return withoutTrailingSlash.replace(/\/api\/doctors$/i, "/api/reports");
  }

  if (withoutTrailingSlash.endsWith("/api")) {
    return `${withoutTrailingSlash}/reports`;
  }

  return `${withoutTrailingSlash}/api/reports`;
};

let reportApi = axios.create({
  baseURL: normalizeDoctorReportBaseUrl(import.meta.env.VITE_DOCTOR_API_BASE_URL),
});

let getToken = () => {
  return localStorage.getItem("authToken") || localStorage.getItem("token");
};

let getAuthHeaders = () => {
  let token = getToken();

  return {
    Authorization: `Bearer ${token}`,
  };
};

let uploadReport = async (formData) => {
  let response = await reportApi.post("/upload", formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

let getMyReports = async () => {
  let response = await reportApi.get("/me", {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return response.data;
};

let getReportById = async (reportId) => {
  let response = await reportApi.get(`/${reportId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return response.data;
};

let updateReport = async (reportId, formData) => {
  let response = await reportApi.put(`/${reportId}`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

let deleteReport = async (reportId) => {
  let response = await reportApi.delete(`/${reportId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return response.data;
};

export {
  uploadReport,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport,
};

export default reportApi;