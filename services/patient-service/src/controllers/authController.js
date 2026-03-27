import User from "../models/User.js";
import Patient from "../models/Patient.js";
import generateToken from "../utils/generateToken.js";

export const registerPatient = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      address,
      emergencyContact,
      allergies,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "PATIENT",
    });

    const patient = await Patient.create({
      userId: user._id,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      address,
      emergencyContact,
      allergies,
    });

    return res.status(201).json({
      message: "Patient registered successfully",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      patient,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const patientProfile =
      user.role === "PATIENT" ? await Patient.findOne({ userId: user._id }) : null;

    return res.status(200).json({
      message: "Login successful",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      patientProfile,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};