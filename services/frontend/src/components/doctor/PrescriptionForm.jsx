import { useEffect, useMemo, useState } from "react";
import { createPrescription } from "../../services/doctor/prescriptionApi";
import { getAppointmentsByDoctorId } from "../../services/doctor/appointmentApi";
import "../../styles/Doctor/prescriptionForm.css";

const createEmptyMedicine = () => ({
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

const createInitialFormData = () => ({
  doctorId: "",
  doctorName: "",
  patientId: "",
  patientName: "",
  appointmentId: "",
  diagnosis: "",
  notes: "",
  status: "active",
});

const safeParseJSON = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getDoctorServiceBaseUrl = () => {
  const configuredBase = String(import.meta.env.VITE_DOCTOR_API_BASE_URL || "").trim();

  if (configuredBase) {
    const normalizedConfiguredBase = configuredBase.replace(/\/+$/, "");

    if (normalizedConfiguredBase.endsWith("/api/doctors")) {
      return normalizedConfiguredBase;
    }

    if (normalizedConfiguredBase.endsWith("/api")) {
      return `${normalizedConfiguredBase}/doctors`;
    }

    return `${normalizedConfiguredBase}/api/doctors`;
  }

  const fallbackHost =
    import.meta.env.VITE_DOCTOR_SERVICE_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:6010`
      : "http://localhost:6010");

  return `${String(fallbackHost).replace(/\/+$/, "")}/api/doctors`;
};

const normalizeDoctorName = (name) => {
  const rawName = String(name || "").trim();

  if (!rawName) return "";

  return /^dr\.?\s/i.test(rawName) ? rawName : `Dr. ${rawName}`;
};

const extractAppointments = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  return [];
};

const getAppointmentIdValue = (appointment) => {
  return (
    appointment?.appointmentId ||
    appointment?._id ||
    appointment?.id ||
    ""
  );
};

const getAppointmentPatientId = (appointment) => {
  const patientId = appointment?.patientId;

  if (typeof patientId === "object" && patientId !== null) {
    return patientId?.patientId || patientId?._id || patientId?.id || "";
  }

  return String(patientId || "");
};

const getAppointmentPatientName = (appointment) => {
  return (
    appointment?.patientName ||
    appointment?.patient?.name ||
    appointment?.patient?.fullName ||
    ""
  );
};

const formatAppointmentOptionLabel = (appointment) => {
  const appointmentCode = getAppointmentIdValue(appointment) || "Appointment";
  const patientName = getAppointmentPatientName(appointment) || "Unknown patient";
  const date = appointment?.appointmentDate || "No date";
  const time = appointment?.appointmentTime || appointment?.startTime || "No time";

  return `${appointmentCode} • ${patientName} • ${date} ${time}`;
};

const PrescriptionForm = () => {
  const [formData, setFormData] = useState(createInitialFormData);
  const [medicines, setMedicines] = useState([createEmptyMedicine()]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingDoctor, setIsResolvingDoctor] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDoctorAppointments = async () => {
      if (!formData.doctorId) {
        if (isMounted) {
          setAppointments([]);
        }
        return;
      }

      try {
        setIsLoadingAppointments(true);
        const response = await getAppointmentsByDoctorId(formData.doctorId);
        const fetchedAppointments = extractAppointments(response);

        if (!isMounted) {
          return;
        }

        setAppointments(fetchedAppointments);
      } catch {
        if (isMounted) {
          setAppointments([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAppointments(false);
        }
      }
    };

    loadDoctorAppointments();

    return () => {
      isMounted = false;
    };
  }, [formData.doctorId]);

  useEffect(() => {
    let isMounted = true;

    const hydrateDoctorIdentity = async () => {
      try {
        setIsResolvingDoctor(true);

        const user =
          safeParseJSON(localStorage.getItem("user") || "") || {};
        const token = localStorage.getItem("authToken") || localStorage.getItem("token");

        const doctorUserId = user?.id || user?._id || "";
        const initialDoctorId = user?.doctorId || "";
        const initialDoctorName = normalizeDoctorName(user?.name || user?.fullName || "");

        if (isMounted) {
          setFormData((previous) => ({
            ...previous,
            doctorId: initialDoctorId,
            doctorName: initialDoctorName,
          }));
        }

        if (!doctorUserId) {
          return;
        }

        const doctorServiceBase = getDoctorServiceBaseUrl();
        const response = await fetch(`${doctorServiceBase}/${doctorUserId}`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const doctor = payload?.data || {};

        const resolvedDoctorId = doctor?.doctorId || initialDoctorId;
        const resolvedDoctorName = normalizeDoctorName(
          doctor?.fullName || doctor?.name || user?.name || user?.fullName
        );

        if (!isMounted) {
          return;
        }

        setFormData((previous) => ({
          ...previous,
          doctorId: resolvedDoctorId,
          doctorName: resolvedDoctorName,
        }));

        if (resolvedDoctorId || resolvedDoctorName) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...user,
              doctorId: resolvedDoctorId || user?.doctorId,
              name: resolvedDoctorName || user?.name,
            })
          );
        }
      } catch {
        // Keep existing values when profile lookup fails.
      } finally {
        if (isMounted) {
          setIsResolvingDoctor(false);
        }
      }
    };

    hydrateDoctorIdentity();

    return () => {
      isMounted = false;
    };
  }, []);

  const medicineCount = useMemo(() => medicines.length, [medicines]);

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAppointmentSelect = (event) => {
    const selectedAppointmentId = event.target.value;
    const selectedAppointment = appointments.find(
      (appointment) => getAppointmentIdValue(appointment) === selectedAppointmentId
    );

    setFormData((previous) => ({
      ...previous,
      appointmentId: selectedAppointmentId,
      patientId: selectedAppointment ? getAppointmentPatientId(selectedAppointment) : "",
      patientName: selectedAppointment ? getAppointmentPatientName(selectedAppointment) : "",
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

    if (!cleanedFormData.doctorId || !cleanedFormData.doctorName) {
      setError("Doctor identity is missing. Please login again and retry.");
      setIsSubmitting(false);
      return;
    }

    if (
      !cleanedFormData.appointmentId ||
      !cleanedFormData.patientId ||
      !cleanedFormData.patientName
    ) {
      setError("Please select an appointment to auto-fill patient details.");
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
      setFormData((previous) => ({
        ...createInitialFormData(),
        doctorId: previous.doctorId,
        doctorName: previous.doctorName,
      }));
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
                  Select an appointment to auto-fill patient ID, patient name,
                  and appointment ID for accurate prescription records.
                </p>
              </div>

              <div className="rx-grid two-col">
                <div className="rx-field">
                  <label>
                    Doctor ID
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
                    placeholder="Doctor name"
                    value={formData.doctorName}
                    onChange={handleChange}
                    readOnly
                    required
                  />
                </div>

                <div className="rx-field full-span">
                  <label>Appointment</label>
                  <select
                    name="selectedAppointment"
                    value={formData.appointmentId}
                    onChange={handleAppointmentSelect}
                    required
                  >
                    <option value="">
                      {isLoadingAppointments
                        ? "Loading appointments..."
                        : "Select appointment"}
                    </option>
                    {appointments.map((appointment) => {
                      const appointmentId = getAppointmentIdValue(appointment);

                      if (!appointmentId) {
                        return null;
                      }

                      return (
                        <option key={appointmentId} value={appointmentId}>
                          {formatAppointmentOptionLabel(appointment)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="rx-field">
                  <label>
                    Patient ID
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
                    placeholder="Patient name"
                    value={formData.patientName}
                    onChange={handleChange}
                    readOnly
                    required
                  />
                </div>

                <div className="rx-field">
                  <label>
                    Appointment ID
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
            disabled={isSubmitting || isResolvingDoctor || isLoadingAppointments}
          >
            {isResolvingDoctor ? (
              <>
                <span className="rx-spinner"></span>
                <span>Loading Doctor Profile...</span>
              </>
            ) : isLoadingAppointments ? (
              <>
                <span className="rx-spinner"></span>
                <span>Loading Appointments...</span>
              </>
            ) : isSubmitting ? (
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