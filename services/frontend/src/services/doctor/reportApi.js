import axios from "axios";

let reportApi = axios.create({
  baseURL: `${import.meta.env.VITE_DOCTOR_API_BASE_URL}/reports`,
});

let getToken = () => {
  return localStorage.getItem("token");
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