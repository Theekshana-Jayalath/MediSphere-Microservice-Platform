import bcrypt from "bcryptjs";
import Doctor from "../models/Doctor.js";

const getSafeDoctor = (doctorDoc) => {
  const doctor = doctorDoc.toObject();
  delete doctor.password;
  return doctor;
};

export const registerDoctor = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      photo,
      specialization,
      licenseNumber,
      experienceYears,
      baseHospital,
      channelingHospitals,
      consultationFee,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !password ||
      !phone ||
      !specialization ||
      !licenseNumber ||
      experienceYears === undefined ||
      !baseHospital ||
      consultationFee === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required doctor registration fields",
      });
    }

    const existingDoctor = await Doctor.findOne({
      $or: [{ email: email.toLowerCase() }, { licenseNumber }],
    });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: "Doctor already exists with this email or license number",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await Doctor.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      photo: photo || "",
      specialization,
      licenseNumber,
      experienceYears,
      baseHospital,
      channelingHospitals: Array.isArray(channelingHospitals)
        ? channelingHospitals
        : [],
      consultationFee,
      availabilitySchedules: Array.isArray(req.body.availabilitySchedules)
        ? req.body.availabilitySchedules
        : [],
      approvalStatus: "pending_approval",
      rejectionReason: "",
      role: "doctor",
    });

    return res.status(201).json({
      success: true,
      message: "Doctor registration submitted and pending admin approval",
      data: getSafeDoctor(doctor),
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("-password");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorApprovalStatus = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select(
      "approvalStatus rejectionReason fullName email"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDoctorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can update only your own profile",
      });
    }

    const updates = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      photo: req.body.photo,
      specialization: req.body.specialization,
      experienceYears: req.body.experienceYears,
      baseHospital: req.body.baseHospital,
      channelingHospitals: req.body.channelingHospitals,
      consultationFee: req.body.consultationFee,
      availabilitySchedules: req.body.availabilitySchedules,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const doctor = await Doctor.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};