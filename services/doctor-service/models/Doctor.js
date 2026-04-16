import mongoose from "mongoose";

const availabilitySlotSchema = new mongoose.Schema(
  {
    channelingHospital: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: String,
      trim: true,
      default: "",
    },
    day: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["In-Person", "Video Call", "Mixed"],
      default: "In-Person",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      default: "",
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    experienceYears: {
      type: Number,
      required: true,
      min: 0,
    },
    baseHospital: {
      type: String,
      required: true,
      trim: true,
    },
    channelingHospitals: {
      type: [String],
      default: [],
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    availabilitySchedules: {
      type: [availabilitySlotSchema],
      default: [],
    },
    approvalStatus: {
      type: String,
      enum: ["pending_approval", "approved", "rejected"],
      default: "pending_approval",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      default: "doctor",
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;