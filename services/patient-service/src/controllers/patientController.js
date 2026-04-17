import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import MedicalHistory from "../models/MedicalHistory.js";
import Counter from "../models/Counter.js";

const generatePatientId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "patientId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `PAT${String(counter.seq).padStart(4, "0")}`;
};

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
      return res
        .status(400)
        .json({ message: "userId, name and email are required" });
    }

    const existingProfile = await Patient.findOne({ userId });

    if (existingProfile) {
      return res
        .status(400)
        .json({ message: "Patient profile already exists" });
    }

    const patientId = await generatePatientId();

    const patient = await Patient.create({
      patientId,
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

    const existingProfile = await Patient.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    if (existingProfile) {
      return res
        .status(400)
        .json({ message: "Patient profile already exists" });
    }

    const patientId = await generatePatientId();

    const patient = await Patient.create({
      patientId,
      userId: new mongoose.Types.ObjectId(req.user.id),
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

export const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

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

    const patient = await Patient.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    if (name !== undefined) patient.name = name;
    if (email !== undefined) patient.email = email;
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
    if (gender !== undefined) patient.gender = gender;
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    if (phone !== undefined) patient.phone = phone;

    if (address !== undefined) {
      patient.address = {
        street: address.street ?? patient.address?.street ?? "",
        city: address.city ?? patient.address?.city ?? "",
        state: address.state ?? patient.address?.state ?? "",
        zipCode: address.zipCode ?? patient.address?.zipCode ?? "",
        country: address.country ?? patient.address?.country ?? "",
      };
    }

    if (emergencyContact !== undefined) {
      patient.emergencyContact = {
        name: emergencyContact.name ?? patient.emergencyContact?.name ?? "",
        relationship:
          emergencyContact.relationship ??
          patient.emergencyContact?.relationship ??
          "",
        phone: emergencyContact.phone ?? patient.emergencyContact?.phone ?? "",
      };
    }

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
    const patient = await Patient.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

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
    const patient = await Patient.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const history = await MedicalHistory.find({ patientId: patient._id }).sort({
      date: -1,
    });

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

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
    const { id } = req.params;

    let patient = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      patient =
        (await Patient.findById(id)) ||
        (await Patient.findOne({ userId: new mongoose.Types.ObjectId(id) }));
    } else {
      patient = await Patient.findOne({ patientId: id });
    }

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json(patient);
  } catch (error) {
    console.error("Failed to fetch patient by id:", error);
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
    const history = await MedicalHistory.find({ patientId: req.params.id }).sort(
      { date: -1 }
    );

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updatePatientById = async (req, res) => {
  try {
    const {
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

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (name !== undefined) patient.name = name;
    if (email !== undefined) patient.email = email;
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
    if (gender !== undefined) patient.gender = gender;
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    if (phone !== undefined) patient.phone = phone;

    if (address !== undefined) {
      patient.address = {
        street: address.street ?? patient.address?.street ?? "",
        city: address.city ?? patient.address?.city ?? "",
        state: address.state ?? patient.address?.state ?? "",
        zipCode: address.zipCode ?? patient.address?.zipCode ?? "",
        country: address.country ?? patient.address?.country ?? "",
      };
    }

    if (emergencyContact !== undefined) {
      patient.emergencyContact = {
        name: emergencyContact.name ?? patient.emergencyContact?.name ?? "",
        relationship:
          emergencyContact.relationship ??
          patient.emergencyContact?.relationship ??
          "",
        phone: emergencyContact.phone ?? patient.emergencyContact?.phone ?? "",
      };
    }

    if (allergies !== undefined) patient.allergies = allergies;

    await patient.save();

    return res.status(200).json({
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deletePatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await Prescription.deleteMany({ patientId: patient._id });
    await MedicalHistory.deleteMany({ patientId: patient._id });
    await Patient.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Patient deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};