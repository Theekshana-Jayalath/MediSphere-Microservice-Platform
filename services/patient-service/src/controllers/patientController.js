import Patient from "../models/Patient.js";
import User from "../models/User.js";
import Prescription from "../models/Prescription.js";
import MedicalHistory from "../models/MedicalHistory.js";

export const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id }).populate(
      "userId",
      "name email role"
    );

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
      name,
    } = req.body;

    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    if (name) {
      await User.findByIdAndUpdate(req.user.id, { name });
    }

    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
    if (gender !== undefined) patient.gender = gender;
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    if (phone !== undefined) patient.phone = phone;
    if (address !== undefined) patient.address = address;
    if (emergencyContact !== undefined) patient.emergencyContact = emergencyContact;
    if (allergies !== undefined) patient.allergies = allergies;

    await patient.save();

    const updatedPatient = await Patient.findOne({ userId: req.user.id }).populate(
      "userId",
      "name email role"
    );

    return res.status(200).json({
      message: "Patient profile updated successfully",
      patient: updatedPatient,
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