import { useState } from "react";
import { createPrescription } from "../../services/doctor/prescriptionApi";
import "../../styles/prescriptionForm.css";

const createEmptyMedicine = () => ({
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

const createUniqueId = (prefix) => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `${prefix}${timestamp}${random}`;
};

const createInitialFormData = () => ({
  doctorId: createUniqueId("DOC"),
  doctorName: "Dr. Julian Vance",
  patientId: createUniqueId("PAT"),
  patientName: "",
  appointmentId: createUniqueId("APT"),
  diagnosis: "",
  notes: "",
  status: "active",
});

const PrescriptionForm = () => {
  const [formData, setFormData] = useState(createInitialFormData);
  const [medicines, setMedicines] = useState([createEmptyMedicine()]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Regenerate individual IDs on demand
  const regenerateId = (idType) => {
    const idPrefixes = {
      doctorId: "DOC",
      patientId: "PAT",
      appointmentId: "APT",
    };

    const prefix = idPrefixes[idType];
    if (!prefix) return;

    setFormData((prev) => ({
      ...prev,
      [idType]: createUniqueId(prefix),
    }));
  };

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleMedicineChange = (index, e) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[index][e.target.name] = e.target.value;
    setMedicines(updatedMedicines);
  };

  const addMedicineRow = () => {
    setMedicines([...medicines, createEmptyMedicine()]);
  };

  const removeMedicineRow = (index) => {
    const updatedMedicines = medicines.filter((_, i) => i !== index);
    setMedicines(updatedMedicines);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    const cleanedFormData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ])
    );

    const cleanedMedicines = medicines
      .map((medicine) => ({
        medicineName: medicine.medicineName.trim(),
        dosage: medicine.dosage.trim(),
        frequency: medicine.frequency.trim(),
        duration: medicine.duration.trim(),
        instructions: medicine.instructions.trim(),
      }))
      .filter(
        (medicine) =>
          medicine.medicineName ||
          medicine.dosage ||
          medicine.frequency ||
          medicine.duration ||
          medicine.instructions
      );

    if (cleanedMedicines.length === 0) {
      setError("Please add at least one medicine before submitting.");
      setIsSubmitting(false);
      return;
    }

    const hasIncompleteMedicine = cleanedMedicines.some(
      (medicine) =>
        !medicine.medicineName ||
        !medicine.dosage ||
        !medicine.frequency ||
        !medicine.duration
    );

    if (hasIncompleteMedicine) {
      setError("Please complete all required medicine details before submitting.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...cleanedFormData,
        medicines: cleanedMedicines,
      };

      const response = await createPrescription(payload);
      setMessage(response.message || "Prescription created successfully");
      setFormData(createInitialFormData());
      setMedicines([createEmptyMedicine()]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create prescription");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="prescription-form-container">
      {/* Header Section */}
      <div className="prescription-header">
        <div className="header-icon">
          <span className="icon">💊</span>
        </div>
        <div className="header-content">
          <h1 className="form-title">Digital Prescription</h1>
          <p className="form-subtitle">Create a comprehensive prescription for your patient</p>
        </div>
        <div className="header-decoration">
          <div className="decoration-line"></div>
          <div className="decoration-circle"></div>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div className="status-message success">
          <span className="status-icon">✅</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="status-message error">
          <span className="status-icon">❌</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="prescription-form">
        {/* Patient & Doctor Information Section */}
        <div className="form-section">
          <div className="section-header">
            <span className="section-icon">👥</span>
            <h2 className="section-title">Patient & Doctor Information</h2>
          </div>

          <div className="auto-generate-notice">
            <span className="notice-icon">⚡</span>
            <span className="notice-text">Doctor ID, Patient ID, and Appointment ID are auto-generated for security and uniqueness</span>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">🆔</span>
                Doctor ID
                <button
                  type="button"
                  onClick={() => regenerateId("doctorId")}
                  className="regenerate-btn"
                  title="Generate new Doctor ID"
                >
                  🔄
                </button>
              </label>
              <input
                type="text"
                name="doctorId"
                placeholder="Auto-generated Doctor ID"
                value={formData.doctorId}
                onChange={handleChange}
                className="form-input"
                required
                readOnly
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">👨‍⚕️</span>
                Doctor Name
              </label>
              <input
                type="text"
                name="doctorName"
                placeholder="Enter doctor name"
                value={formData.doctorName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">🆔</span>
                Patient ID
                <button
                  type="button"
                  onClick={() => regenerateId("patientId")}
                  className="regenerate-btn"
                  title="Generate new Patient ID"
                >
                  🔄
                </button>
              </label>
              <input
                type="text"
                name="patientId"
                placeholder="Auto-generated Patient ID"
                value={formData.patientId}
                onChange={handleChange}
                className="form-input"
                required
                readOnly
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">👤</span>
                Patient Name
              </label>
              <input
                type="text"
                name="patientName"
                placeholder="Enter patient name"
                value={formData.patientName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">📅</span>
                Appointment ID
                <button
                  type="button"
                  onClick={() => regenerateId("appointmentId")}
                  className="regenerate-btn"
                  title="Generate new Appointment ID"
                >
                  🔄
                </button>
              </label>
              <input
                type="text"
                name="appointmentId"
                placeholder="Auto-generated Appointment ID"
                value={formData.appointmentId}
                onChange={handleChange}
                className="form-input"
                required
                readOnly
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">📊</span>
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="active">🟢 Active</option>
                <option value="completed">🔵 Completed</option>
                <option value="cancelled">🔴 Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Medical Information Section */}
        <div className="form-section">
          <div className="section-header">
            <span className="section-icon">🏥</span>
            <h2 className="section-title">Medical Information</h2>
          </div>

          <div className="medical-info-grid">
            <div className="input-group full-width">
              <label className="input-label">
                <span className="label-icon">🔍</span>
                Diagnosis
              </label>
              <textarea
                name="diagnosis"
                placeholder="Enter detailed diagnosis..."
                value={formData.diagnosis}
                onChange={handleChange}
                className="form-textarea"
                rows="4"
                required
              />
            </div>

            <div className="input-group full-width">
              <label className="input-label">
                <span className="label-icon">📝</span>
                Doctor Notes
              </label>
              <textarea
                name="notes"
                placeholder="Additional notes and observations..."
                value={formData.notes}
                onChange={handleChange}
                className="form-textarea"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Medicines Section */}
        <div className="form-section">
          <div className="section-header">
            <span className="section-icon">💊</span>
            <h2 className="section-title">Prescribed Medicines</h2>
          </div>

          <div className="medicines-container">
            {medicines.map((medicine, index) => (
              <div key={index} className="medicine-card">
                <div className="medicine-header">
                  <span className="medicine-number">Medicine #{index + 1}</span>
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicineRow(index)}
                      className="remove-medicine-btn"
                      title="Remove medicine"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <div className="medicine-grid">
                  <div className="input-group">
                    <label className="input-label">
                      <span className="label-icon">💊</span>
                      Medicine Name
                    </label>
                    <input
                      type="text"
                      name="medicineName"
                      placeholder="e.g., Amoxicillin"
                      value={medicine.medicineName}
                      onChange={(e) => handleMedicineChange(index, e)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      <span className="label-icon">📏</span>
                      Dosage
                    </label>
                    <input
                      type="text"
                      name="dosage"
                      placeholder="e.g., 500mg"
                      value={medicine.dosage}
                      onChange={(e) => handleMedicineChange(index, e)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      <span className="label-icon">⏰</span>
                      Frequency
                    </label>
                    <input
                      type="text"
                      name="frequency"
                      placeholder="e.g., 3 times daily"
                      value={medicine.frequency}
                      onChange={(e) => handleMedicineChange(index, e)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      <span className="label-icon">📅</span>
                      Duration
                    </label>
                    <input
                      type="text"
                      name="duration"
                      placeholder="e.g., 7 days"
                      value={medicine.duration}
                      onChange={(e) => handleMedicineChange(index, e)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="input-group full-width">
                    <label className="input-label">
                      <span className="label-icon">📋</span>
                      Instructions
                    </label>
                    <textarea
                      name="instructions"
                      placeholder="Special instructions for taking this medicine..."
                      value={medicine.instructions}
                      onChange={(e) => handleMedicineChange(index, e)}
                      className="form-textarea"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addMedicineRow}
              className="add-medicine-btn"
            >
              <span className="btn-icon">+</span>
              Add Another Medicine
            </button>
          </div>
        </div>

        {/* Submit Section */}
        <div className="form-actions">
          <button
            type="submit"
            className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner"></span>
                Creating Prescription...
              </>
            ) : (
              <>
                <span className="btn-icon">💾</span>
                Save Prescription
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionForm;