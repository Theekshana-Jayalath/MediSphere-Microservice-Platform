import axios from "axios";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:5015";

const forwardAuthHeader = (req) => {
  const headers = {};
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  return headers;
};

// Get all doctors
export const getAllDoctors = async (req, res) => {
  try {
    const response = await axios.get(`${API_GATEWAY_URL}/api/doctors`, {
      headers: forwardAuthHeader(req),
    });

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch doctors",
      error: error.response?.data || error.message,
    });
  }
};

// Get pending doctor requests
export const getPendingDoctors = async (req, res) => {
  try {
    const response = await axios.get(
      `${API_GATEWAY_URL}/api/doctors/pending`,
      {
        headers: forwardAuthHeader(req),
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch pending doctors",
      error: error.response?.data || error.message,
    });
  }
};

// Get doctor by id
export const getDoctorById = async (req, res) => {
  try {
    const response = await axios.get(
      `${API_GATEWAY_URL}/api/doctors/${req.params.id}`,
      {
        headers: forwardAuthHeader(req),
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch doctor",
      error: error.response?.data || error.message,
    });
  }
};

// Approve doctor
export const approveDoctor = async (req, res) => {
  try {
    const response = await axios.put(
      `${API_GATEWAY_URL}/api/doctors/${req.params.id}/approve`,
      {},
      {
        headers: forwardAuthHeader(req),
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to approve doctor",
      error: error.response?.data || error.message,
    });
  }
};

// Reject doctor
export const rejectDoctor = async (req, res) => {
  try {
    const response = await axios.put(
      `${API_GATEWAY_URL}/api/doctors/${req.params.id}/reject`,
      {
        rejectionReason: req.body.rejectionReason || "",
      },
      {
        headers: forwardAuthHeader(req),
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to reject doctor",
      error: error.response?.data || error.message,
    });
  }
};

// Update doctor
export const updateDoctor = async (req, res) => {
  try {
    const response = await axios.put(
      `${API_GATEWAY_URL}/api/doctors/${req.params.id}`,
      req.body,
      {
        headers: forwardAuthHeader(req),
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to update doctor",
      error: error.response?.data || error.message,
    });
  }
};

// Delete doctor
export const deleteDoctor = async (req, res) => {
  try {
    const response = await axios.delete(
      `${API_GATEWAY_URL}/api/doctors/${req.params.id}`,
      {
        headers: forwardAuthHeader(req),
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to delete doctor",
      error: error.response?.data || error.message,
    });
  }
};