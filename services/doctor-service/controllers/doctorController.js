import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";

const getSafeDoctor = (doctorDoc) => {
  const doctor = doctorDoc.toObject();
  delete doctor.password;
  return doctor;
};

const generateDoctorToken = (doctor) => {
  return jwt.sign(
    {
      id: doctor._id,
      email: doctor.email,
      role: doctor.role || "doctor",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
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
      email: email.toLowerCase(),
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

    console.log("Doctor registered successfully:", doctor._id);

    return res.status(201).json({
      success: true,
      message:
        "Doctor registration submitted successfully and pending admin approval",
      data: getSafeDoctor(doctor),
    });
  } catch (error) {
    console.error("Doctor registration error:", error);
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

export const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ approvalStatus: "pending_approval" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

export const approveDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "approved",
        rejectionReason: "",
      },
      {
        new: true,
        runValidators: true,
        select: "-password",
      }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor approved successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "rejected",
        rejectionReason: req.body.rejectionReason || "",
      },
      {
        new: true,
        runValidators: true,
        select: "-password",
      }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor rejected successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const updates = {
      fullName: req.body.fullName,
      email: req.body.email ? req.body.email.toLowerCase() : undefined,
      phone: req.body.phone,
      photo: req.body.photo,
      specialization: req.body.specialization,
      licenseNumber: req.body.licenseNumber,
      experienceYears: req.body.experienceYears,
      baseHospital: req.body.baseHospital,
      channelingHospitals: req.body.channelingHospitals,
      consultationFee: req.body.consultationFee,
      availabilitySchedules: req.body.availabilitySchedules,
      approvalStatus: req.body.approvalStatus,
      rejectionReason: req.body.rejectionReason,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, updates, {
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
      message: "Doctor updated successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: generateDoctorToken(doctor),
      user: {
        id: doctor._id,
        name: doctor.fullName,
        email: doctor.email,
        role: doctor.role || "doctor",
        approvalStatus: doctor.approvalStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};