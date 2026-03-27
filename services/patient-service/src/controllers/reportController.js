import fs from "fs";
import path from "path";
import Patient from "../models/Patient.js";
import Report from "../models/Report.js";

export const uploadReport = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, description, reportType } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Report title is required" });
    }

    const report = await Report.create({
      patientId: patient._id,
      uploadedBy: req.user.id,
      title,
      description,
      fileUrl: `/src/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      reportType,
    });

    return res.status(201).json({
      message: "Report uploaded successfully",
      report,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const reports = await Report.find({ patientId: patient._id })
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(reports);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const report = await Report.findOne({
      _id: req.params.id,
      patientId: patient._id,
    }).populate("uploadedBy", "name email role");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json(report);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateReport = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const report = await Report.findOne({
      _id: req.params.id,
      patientId: patient._id,
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this report" });
    }

    const { title, description, reportType } = req.body;

    if (title !== undefined) report.title = title;
    if (description !== undefined) report.description = description;
    if (reportType !== undefined) report.reportType = reportType;

    if (req.file) {
      if (report.fileUrl) {
        const oldFilePath = path.join(process.cwd(), report.fileUrl.replace(/^\//, ""));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      report.fileUrl = `/src/uploads/${req.file.filename}`;
      report.fileName = req.file.originalname;
      report.fileType = req.file.mimetype;
      report.fileSize = req.file.size;
    }

    await report.save();

    return res.status(200).json({
      message: "Report updated successfully",
      report,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const report = await Report.findOne({
      _id: req.params.id,
      patientId: patient._id,
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this report" });
    }

    if (report.fileUrl) {
      const filePath = path.join(process.cwd(), report.fileUrl.replace(/^\//, ""));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await report.deleteOne();

    return res.status(200).json({
      message: "Report deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};