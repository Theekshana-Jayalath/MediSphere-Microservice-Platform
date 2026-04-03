import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import MedicalHistory from "../models/MedicalHistory.js";

export const createPatientProfileForRegistration = async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      address,
      emergencyContact,
      allergies,
    } = req.body;

    if (!userId || !name || !email) {
      return res.status(400).json({ message: "userId, name and email are required" });
    }

    const existingProfile = await Patient.findOne({ userId });

    if (existingProfile) {
      return res.status(400).json({ message: "Patient profile already exists" });
    }

    const patient = await Patient.create({
      userId,
      name,
      email,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      address,
      emergencyContact,
      allergies,
    });

    return res.status(201).json({
      message: "Patient profile created successfully",
      patient,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createPatientProfile = async (req, res) => {
  try {
    const {
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      address,
      emergencyContact,
      allergies,
    } = req.body;

    const existingProfile = await Patient.findOne({ userId: req.user.id });

    if (existingProfile) {
      return res.status(400).json({ message: "Patient profile already exists" });
    }

    const patient = await Patient.create({
      userId: req.user.id,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      address,
      emergencyContact,
      allergies,
    });

    return res.status(201).json({
      message: "Patient profile created successfully",
      patient,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const {
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      address,
      emergencyContact,
      allergies,
    } = req.body;

    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
    if (gender !== undefined) patient.gender = gender;
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    if (phone !== undefined) patient.phone = phone;
    if (address !== undefined) patient.address = address;
    if (emergencyContact !== undefined) patient.emergencyContact = emergencyContact;
    if (allergies !== undefined) patient.allergies = allergies;

    await patient.save();

    return res.status(200).json({
      message: "Patient profile updated successfully",
      patient,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyPrescriptions = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const prescriptions = await Prescription.find({ patientId: patient._id })
      .populate("doctorId", "name email")
      .sort({ issuedDate: -1 });

    return res.status(200).json(prescriptions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyMedicalHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const history = await MedicalHistory.find({ patientId: patient._id }).sort({ date: -1 });

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Admin/general routes
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    return res.status(200).json(patients);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPatientPrescriptionsById = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.id })
      .populate("doctorId", "name email")
      .sort({ issuedDate: -1 });

    return res.status(200).json(prescriptions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPatientHistoryById = async (req, res) => {
  try {
    const history = await MedicalHistory.find({ patientId: req.params.id }).sort({ date: -1 });

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};