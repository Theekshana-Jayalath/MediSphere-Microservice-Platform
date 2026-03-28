import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
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
    appointmentId: {
      type: String,
      required: true,
      trim: true,
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    medicines: {
      type: [medicineSchema],
      required: true,
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "At least one medicine is required",
      },
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;