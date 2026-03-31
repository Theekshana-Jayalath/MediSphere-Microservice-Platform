import Prescription from "../models/Prescription.js";

export const createPrescription = async (req, res, next) => {
  try {
    const {
      doctorId,
      doctorName,
      patientId,
      patientName,
      appointmentId,
      diagnosis,
      medicines,
      notes,
      status,
    } = req.body;

    if (
      !doctorId ||
      !doctorName ||
      !patientId ||
      !patientName ||
      !appointmentId ||
      !diagnosis ||
      !medicines
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const prescription = await Prescription.create({
      doctorId,
      doctorName,
      patientId,
      patientName,
      appointmentId,
      diagnosis,
      medicines,
      notes,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionsByDoctor = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({
      doctorId: req.params.doctorId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionsByPatient = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({
      patientId: req.params.patientId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: updatedPrescription,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    await Prescription.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};