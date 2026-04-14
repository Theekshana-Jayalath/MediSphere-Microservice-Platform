import axios from "axios";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:5015";

const forwardAuthHeader = (req) => {
  const headers = {};
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  return headers;
};

// These routes assume auth-service has matching endpoints.
export const getAllUsers = async (req, res) => {
  try {
    const response = await axios.get(`${API_GATEWAY_URL}/api/auth/users`, {
      headers: forwardAuthHeader(req),
    });
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch users",
      error: error.response?.data || error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const response = await axios.get(
      `${API_GATEWAY_URL}/api/auth/users/${req.params.id}`,
      {
        headers: forwardAuthHeader(req),
      }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch user",
      error: error.response?.data || error.message,
    });
  }
};

export const activateUser = async (req, res) => {
  try {
    const response = await axios.put(
      `${API_GATEWAY_URL}/api/auth/users/${req.params.id}/status`,
      { status: "active" },
      { headers: forwardAuthHeader(req) }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to activate user",
      error: error.response?.data || error.message,
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const response = await axios.put(
      `${API_GATEWAY_URL}/api/auth/users/${req.params.id}/status`,
      { status: "inactive" },
      { headers: forwardAuthHeader(req) }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to deactivate user",
      error: error.response?.data || error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const response = await axios.delete(
      `${API_GATEWAY_URL}/api/auth/users/${req.params.id}`,
      {
        headers: forwardAuthHeader(req),
      }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to delete user",
      error: error.response?.data || error.message,
    });
  }
};