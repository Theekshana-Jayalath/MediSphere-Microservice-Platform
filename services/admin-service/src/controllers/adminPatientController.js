import axios from "axios";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:5015";

const forwardAuthHeader = (req) => {
  const headers = {};
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  return headers;
};

export const getAllPatients = async (req, res) => {
  try {
    const response = await axios.get(`${API_GATEWAY_URL}/api/patients`, {
      headers: forwardAuthHeader(req),
    });
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch patients",
      error: error.response?.data || error.message,
    });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const response = await axios.get(
      `${API_GATEWAY_URL}/api/patients/${req.params.id}`,
      {
        headers: forwardAuthHeader(req),
      }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch patient",
      error: error.response?.data || error.message,
    });
  }
};

export const getPatientReports = async (req, res) => {
  try {
    const response = await axios.get(
      `${API_GATEWAY_URL}/api/patients/${req.params.id}/reports`,
      {
        headers: forwardAuthHeader(req),
      }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch patient reports",
      error: error.response?.data || error.message,
    });
  }
};

export const getPatientHistory = async (req, res) => {
  try {
    const response = await axios.get(
      `${API_GATEWAY_URL}/api/patients/${req.params.id}/history`,
      {
        headers: forwardAuthHeader(req),
      }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch patient history",
      error: error.response?.data || error.message,
    });
  }
};

export const getPatientPrescriptions = async (req, res) => {
  try {
    const response = await axios.get(
      `${API_GATEWAY_URL}/api/patients/${req.params.id}/prescriptions`,
      {
        headers: forwardAuthHeader(req),
      }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch patient prescriptions",
      error: error.response?.data || error.message,
    });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const response = await axios.put(
      `${API_GATEWAY_URL}/api/patients/${req.params.id}`,
      req.body,
      {
        headers: {
          ...forwardAuthHeader(req),
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to update patient",
      error: error.response?.data || error.message,
    });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const response = await axios.delete(
      `${API_GATEWAY_URL}/api/patients/${req.params.id}`,
      {
        headers: forwardAuthHeader(req),
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to delete patient",
      error: error.response?.data || error.message,
    });
  }
};