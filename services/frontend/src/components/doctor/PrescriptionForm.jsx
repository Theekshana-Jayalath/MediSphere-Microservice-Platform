import { useMemo, useState } from "react";
import { createPrescription } from "../../services/doctor/prescriptionApi";
import "../../styles/Doctor/prescriptionForm.css";

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

  const medicineCount = useMemo(() => medicines.length, [medicines]);

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
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create prescription"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rx-page-shell">
      <div className="rx-hero-card">
        <div className="rx-hero-left">
          <div className="rx-hero-badge">MEDISPHERE DIGITAL CARE</div>
          <h1 className="rx-hero-title">Issue Prescription</h1>
          <p className="rx-hero-text">
            Create structured, secure, and professional digital prescriptions
            with patient details, clinical notes, and medicine instructions in
            one elegant workflow.
          </p>

          <div className="rx-hero-stats">
            <div className="rx-stat-card">
              <span>Medicine Rows</span>
              <strong>{medicineCount}</strong>
            </div>
            <div className="rx-stat-card">
              <span>Status</span>
              <strong>{formData.status}</strong>
            </div>
          </div>
        </div>

        <div className="rx-hero-right">
          <div className="rx-preview-card">
            <div className="rx-preview-top">
              <span className="rx-preview-chip">Live Preview</span>
              <span className="rx-preview-dot"></span>
            </div>
            <h3>{formData.patientName || "Patient Name"}</h3>
            <p>{formData.diagnosis || "Diagnosis preview will appear here"}</p>
            <div className="rx-preview-meta">
              <span>{formData.doctorName || "Doctor"}</span>
              <span>{medicineCount} medicines</span>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="rx-alert rx-alert-success">
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rx-alert rx-alert-error">
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rx-form">
        <div className="rx-main-grid">
          <div className="rx-left-column">
            <section className="rx-section-card">
              <div className="rx-section-head">
                <div>
                  <p className="rx-section-kicker">Core Identity</p>
                  <h2>Doctor & Patient Information</h2>
                </div>
                <div className="rx-section-icon">👥</div>
              </div>

              <div className="rx-inline-note">
                <span>⚡</span>
                <p>
                  Doctor ID, Patient ID, and Appointment ID are auto-generated
                  for secure record keeping.
                </p>
              </div>

              <div className="rx-grid two-col">
                <div className="rx-field">
                  <label>
                    Doctor ID
                    <button
                      type="button"
                      onClick={() => regenerateId("doctorId")}
                      className="rx-mini-action"
                      title="Generate new Doctor ID"
                    >
                      🔄
                    </button>
                  </label>
                  <input
                    type="text"
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    readOnly
                  />
                </div>

                <div className="rx-field">
                  <label>Doctor Name</label>
                  <input
                    type="text"
                    name="doctorName"
                    placeholder="Enter doctor name"
                    value={formData.doctorName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="rx-field">
                  <label>
                    Patient ID
                    <button
                      type="button"
                      onClick={() => regenerateId("patientId")}
                      className="rx-mini-action"
                      title="Generate new Patient ID"
                    >
                      🔄
                    </button>
                  </label>
                  <input
                    type="text"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    readOnly
                  />
                </div>

                <div className="rx-field">
                  <label>Patient Name</label>
                  <input
                    type="text"
                    name="patientName"
                    placeholder="Enter patient name"
                    value={formData.patientName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="rx-field">
                  <label>
                    Appointment ID
                    <button
                      type="button"
                      onClick={() => regenerateId("appointmentId")}
                      className="rx-mini-action"
                      title="Generate new Appointment ID"
                    >
                      🔄
                    </button>
                  </label>
                  <input
                    type="text"
                    name="appointmentId"
                    value={formData.appointmentId}
                    onChange={handleChange}
                    readOnly
                  />
                </div>

                <div className="rx-field">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">🟢 Active</option>
                    <option value="completed">🔵 Completed</option>
                    <option value="cancelled">🔴 Cancelled</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rx-section-card">
              <div className="rx-section-head">
                <div>
                  <p className="rx-section-kicker">Clinical Summary</p>
                  <h2>Diagnosis & Notes</h2>
                </div>
                <div className="rx-section-icon">🏥</div>
              </div>

              <div className="rx-grid one-col">
                <div className="rx-field">
                  <label>Diagnosis</label>
                  <textarea
                    name="diagnosis"
                    placeholder="Enter detailed diagnosis..."
                    value={formData.diagnosis}
                    onChange={handleChange}
                    rows="5"
                    required
                  />
                </div>

                <div className="rx-field">
                  <label>Doctor Notes</label>
                  <textarea
                    name="notes"
                    placeholder="Additional notes, observations, or precautions..."
                    value={formData.notes}
                    onChange={handleChange}
                    rows="4"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="rx-right-column">
            <section className="rx-section-card">
              <div className="rx-section-head">
                <div>
                  <p className="rx-section-kicker">Medication Plan</p>
                  <h2>Prescribed Medicines</h2>
                </div>
                <div className="rx-section-icon">💊</div>
              </div>

              <div className="rx-medicine-stack">
                {medicines.map((medicine, index) => (
                  <div key={index} className="rx-medicine-card">
                    <div className="rx-medicine-card-top">
                      <div className="rx-medicine-badge">
                        Medicine {index + 1}
                      </div>

                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(index)}
                          className="rx-remove-btn"
                          title="Remove medicine"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    <div className="rx-grid two-col">
                      <div className="rx-field">
                        <label>Medicine Name</label>
                        <input
                          type="text"
                          name="medicineName"
                          placeholder="e.g., Amoxicillin"
                          value={medicine.medicineName}
                          onChange={(e) => handleMedicineChange(index, e)}
                          required
                        />
                      </div>

                      <div className="rx-field">
                        <label>Dosage</label>
                        <input
                          type="text"
                          name="dosage"
                          placeholder="e.g., 500mg"
                          value={medicine.dosage}
                          onChange={(e) => handleMedicineChange(index, e)}
                          required
                        />
                      </div>

                      <div className="rx-field">
                        <label>Frequency</label>
                        <input
                          type="text"
                          name="frequency"
                          placeholder="e.g., 3 times daily"
                          value={medicine.frequency}
                          onChange={(e) => handleMedicineChange(index, e)}
                          required
                        />
                      </div>

                      <div className="rx-field">
                        <label>Duration</label>
                        <input
                          type="text"
                          name="duration"
                          placeholder="e.g., 7 days"
                          value={medicine.duration}
                          onChange={(e) => handleMedicineChange(index, e)}
                          required
                        />
                      </div>

                      <div className="rx-field full-span">
                        <label>Instructions</label>
                        <textarea
                          name="instructions"
                          placeholder="Special instructions for taking this medicine..."
                          value={medicine.instructions}
                          onChange={(e) => handleMedicineChange(index, e)}
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMedicineRow}
                  className="rx-add-btn"
                >
                  <span>＋</span>
                  <span>Add Another Medicine</span>
                </button>
              </div>
            </section>
          </div>
        </div>

        <div className="rx-submit-bar">
          <div className="rx-submit-note">
            Review all fields carefully before saving the digital prescription.
          </div>

          <button
            type="submit"
            className={`rx-submit-btn ${isSubmitting ? "submitting" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="rx-spinner"></span>
                <span>Creating Prescription...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save Prescription</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionForm;