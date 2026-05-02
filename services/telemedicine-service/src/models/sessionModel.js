import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    // 🔗 Link to appointment (from appointment service)
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // 👨‍⚕️ Doctor details
    doctorId: {
      type: String,
      required: true,
      trim: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    doctorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    doctorPhone: {
      type: String,
      trim: true,
      default: "",
    },

    // 🧑‍⚕️ Patient details
    patientId: {
      type: String,
      required: true,
      trim: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    patientPhone: {
      type: String,
      required: true,
      trim: true,
    },

    // 🩺 Extra info
    specialty: {
      type: String,
      default: "",
      trim: true,
    },

    // 🎥 Meeting info
    roomName: {
      type: String,
      required: true,
      trim: true,
    },
    meetingLink: {
      type: String,
      required: true,
      trim: true,
    },

    // ⏰ Timing
    scheduledTime: {
      type: Date,
      required: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // 🔄 Session lifecycle
    status: {
      type: String,
      enum: ["scheduled", "started", "completed", "cancelled"],
      default: "scheduled",
    },

    // 📝 Doctor notes after consultation
    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // 🔒 Optional: prevent duplicate creation race conditions
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔍 Index for faster lookup
sessionSchema.index({ appointmentId: 1 });
sessionSchema.index({ doctorId: 1 });
sessionSchema.index({ patientId: 1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;