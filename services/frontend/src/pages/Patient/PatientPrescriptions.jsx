import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/Patient/PatientSidebar";
import "../../styles/Patient/PatientPrescriptions.css";

export default function PatientPrescriptions() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const storedPatientProfile = localStorage.getItem("patientProfile");
  const patientProfile = storedPatientProfile ? JSON.parse(storedPatientProfile) : null;

  const patientName =
    patientProfile?.name || patientProfile?.fullName || user?.name || "Patient";

  const patientMongoId =
    user?.id ||
    user?._id ||
    patientProfile?._id ||
    patientProfile?.id ||
    "";

  const patientDisplayId =
    patientProfile?.patientId || user?.patientId || "";

  const patientId = patientDisplayId || patientMongoId || "PAT0004";

  const patientEmail = patientProfile?.email || user?.email || "No email";

  const PRESCRIPTIONS_BASE_URL = import.meta.env.VITE_DOCTOR_SERVICE_URL
    ? `${import.meta.env.VITE_DOCTOR_SERVICE_URL}/api/prescriptions`
    : "http://localhost:6010/api/prescriptions";

  const parseResponseData = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();
    return {
      message: text || "Unexpected server response",
    };
  };

  const mapPrescriptionForUI = (prescription) => {
    const firstMedicine =
      Array.isArray(prescription.medicines) && prescription.medicines.length > 0
        ? prescription.medicines[0]
        : null;

    return {
      ...prescription,
      medicineName: firstMedicine?.medicineName || "No medicine",
      category: prescription.diagnosis || "General",
      dosage: firstMedicine?.dosage || "--",
      dosageForm: "",
      frequency: firstMedicine?.frequency || "--",
      prescribedBy: prescription.doctorName || "--",
      instructions: firstMedicine?.instructions || prescription.notes || "--",
      issuedDate: prescription.issuedDate || prescription.createdAt,
      status: String(prescription.status || "active").toUpperCase(),
      medicines: Array.isArray(prescription.medicines) ? prescription.medicines : [],
    };
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);

      const token =
        user?.token ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        "";

      const idsToTry = [patientMongoId, patientDisplayId].filter(Boolean);

      console.log("Logged-in patient Mongo ID:", patientMongoId);
      console.log("Logged-in patient Display ID:", patientDisplayId);
      console.log("Fetching prescriptions for:", idsToTry);

      if (idsToTry.length === 0) {
        setPrescriptions([]);
        return;
      }

      const responses = await Promise.all(
        idsToTry.map(async (id) => {
          try {
            const response = await fetch(
              `${PRESCRIPTIONS_BASE_URL}/patient/${id}`,
              {
                method: "GET",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              }
            );

            const data = await parseResponseData(response);

            if (!response.ok) {
              return [];
            }

            return Array.isArray(data)
              ? data
              : Array.isArray(data?.data)
              ? data.data
              : [];
          } catch (error) {
            console.error(`Failed to fetch prescriptions for ID ${id}:`, error);
            return [];
          }
        })
      );

      const mergedPrescriptions = responses.flat();

      const uniquePrescriptions = Array.from(
        new Map(
          mergedPrescriptions.map((prescription) => [
            prescription._id ||
              `${prescription.appointmentId}-${prescription.patientId}-${prescription.createdAt}`,
            prescription,
          ])
        ).values()
      );

      setPrescriptions(uniquePrescriptions.map(mapPrescriptionForUI));
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const handleDownloadPrescription = (prescription) => {
    // Create a formatted prescription text
    const prescriptionText = `
PRESCRIPTION DETAILS
====================

APPOINTMENT ID: ${prescription.appointmentId}
PATIENT NAME: ${patientName}
PATIENT ID: ${patientId}

MEDICATION INFORMATION:
----------------------
Medication: ${prescription.medicineName}
Category: ${prescription.category}
Dosage: ${prescription.dosage}
Frequency: ${prescription.frequency}
Instructions: ${prescription.instructions}

PRESCRIBING PHYSICIAN: ${prescription.prescribedBy}
ISSUED DATE: ${prescription.issuedDate ? new Date(prescription.issuedDate).toLocaleDateString() : "--"}

${prescription.medicines.length > 1 ? "\nALL MEDICATIONS:\n----------------" + prescription.medicines.map(med => `\n- ${med.medicineName}\n  Dosage: ${med.dosage}\n  Frequency: ${med.frequency}\n  Duration: ${med.duration}`).join("\n") : ""}

This is a computer-generated prescription. Please consult your physician for any concerns.
    `;

    // Create a blob and download
    const blob = new Blob([prescriptionText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescription_${prescription.appointmentId || "download"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTalkToSpecialist = () => {
    navigate("/patient/appointments");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("patientProfile");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((p) => {
      const medicineNames = Array.isArray(p.medicines)
        ? p.medicines.map((medicine) => medicine.medicineName).join(" ")
        : "";

      return (
        medicineNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.prescribedBy || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.appointmentId || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [prescriptions, searchTerm]);

  return (
    <div className="patient-prescriptions-page">
      <PatientSidebar
        patientName={patientName}
        patientId={patientId}
        activeItem="prescriptions"
        onLogout={handleLogout}
      />

      <main className="patient-prescriptions-main">
        <div className="prescriptions-container">
          <div className="prescriptions-header">
            <div>
              <h1>Prescription Management</h1>
              <p>View your prescribed medications and treatment history</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <p>Active Prescriptions</p>
              <h3>{prescriptions.length}</h3>
            </div>
          </div>

          <div className="action-bar">
            <div className="search-wrapper">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search by medication, doctor, category or appointment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="action-buttons">
              <button className="action-btn refresh" onClick={fetchPrescriptions}>
                <span className="material-symbols-outlined">refresh</span>
                Refresh
              </button>
              <button className="action-btn filter">
                <span className="material-symbols-outlined">filter_list</span>
                Filter
              </button>
              <button className="action-btn sort">
                <span className="material-symbols-outlined">sort</span>
                Sort
              </button>
            </div>
          </div>

          <div className="prescriptions-table-container">
            <h2>Active Prescriptions</h2>

            {loading ? (
              <div className="empty-state">
                <span className="material-symbols-outlined">medication</span>
                <p>Loading prescriptions...</p>
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-outlined">medication</span>
                <p>No prescriptions found</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="prescriptions-table">
                  <thead>
                    <tr>
                      <th>APPOINTMENT ID</th>
                      <th>MEDICATION</th>
                      <th>DOSAGE & FREQUENCY</th>
                      <th>PRESCRIBING PHYSICIAN</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrescriptions.map((prescription) => (
                      <tr key={prescription._id}>
                        <td className="appointment-cell">
                          <div className="appointment-id">{prescription.appointmentId}</div>
                        </td>
                        <td>
                          <div className="medication-name">{prescription.medicineName}</div>
                          <div className="medication-category">{prescription.category}</div>
                        </td>
                        <td>
                          <div>{prescription.dosage} {prescription.dosageForm}</div>
                          <div className="frequency">{prescription.frequency}</div>
                        </td>
                        <td>{prescription.prescribedBy}</td>
                        <td>
                          <div className="action-buttons-group">
                            <button
                              className="view-details-btn"
                              onClick={() => handleViewDetails(prescription)}
                            >
                              View Details
                              <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                            <button
                              className="download-btn"
                              onClick={() => handleDownloadPrescription(prescription)}
                              title="Download Prescription"
                            >
                              <span className="material-symbols-outlined">download</span>
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {showDetailsModal && selectedPrescription && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Prescription Details</h3>
              <button onClick={() => setShowDetailsModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <label>APPOINTMENT ID</label>
                <p>{selectedPrescription.appointmentId}</p>
              </div>

              <div className="detail-section">
                <label>MEDICATION NAME</label>
                <p>{selectedPrescription.medicineName}</p>
              </div>

              <div className="detail-section">
                <label>CATEGORY</label>
                <p>{selectedPrescription.category}</p>
              </div>

              <div className="detail-row-group">
                <div className="detail-section half">
                  <label>DOSAGE</label>
                  <p>{selectedPrescription.dosage} {selectedPrescription.dosageForm}</p>
                </div>
                <div className="detail-section half">
                  <label>FREQUENCY</label>
                  <p>{selectedPrescription.frequency}</p>
                </div>
              </div>

              <div className="detail-section">
                <label>PRESCRIBED BY</label>
                <p>{selectedPrescription.prescribedBy}</p>
              </div>

              <div className="detail-section">
                <label>INSTRUCTIONS</label>
                <p className="instructions-text">{selectedPrescription.instructions}</p>
              </div>

              {selectedPrescription.medicines.length > 1 && (
                <div className="detail-section">
                  <label>ALL MEDICINES</label>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {selectedPrescription.medicines.map((medicine, index) => (
                      <div
                        key={`${medicine.medicineName}-${index}`}
                        style={{
                          padding: "12px",
                          borderRadius: "12px",
                          background: "#f8f2ee",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 6px 0",
                            fontWeight: 600,
                          }}
                        >
                          {medicine.medicineName}
                        </p>
                        <p style={{ margin: "0 0 4px 0" }}>
                          {medicine.dosage} • {medicine.frequency}
                        </p>
                        <p style={{ margin: 0, color: "#75777e" }}>
                          {medicine.duration}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <label>ISSUED DATE</label>
                <p>
                  {selectedPrescription.issuedDate
                    ? new Date(selectedPrescription.issuedDate).toLocaleDateString()
                    : "--"}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="download-modal-btn"
                onClick={() => handleDownloadPrescription(selectedPrescription)}
              >
                <span className="material-symbols-outlined">download</span>
                Download Prescription
              </button>
              <button className="close-modal-btn" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 550px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #ede7e3;
          position: sticky;
          top: 0;
          background: white;
          z-index: 1;
        }

        .modal-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #07182e;
          margin: 0;
        }

        .modal-header button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .modal-header button:hover {
          background: #f8f2ee;
        }

        .modal-body {
          padding: 24px;
        }

        .detail-section {
          margin-bottom: 20px;
        }

        .detail-section label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #75777e;
          margin-bottom: 6px;
        }

        .detail-section p {
          font-size: 15px;
          color: #1d1b19;
          margin: 0;
        }

        .detail-row-group {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .detail-section.half {
          flex: 1;
          margin-bottom: 0;
        }

        .instructions-text {
          line-height: 1.5;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #ede7e3;
          position: sticky;
          bottom: 0;
          background: white;
        }

        .close-modal-btn {
          padding: 10px 24px;
          background: #07182e;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: white;
          cursor: pointer;
        }

        .close-modal-btn:hover {
          background: #1d2d44;
        }

        .download-modal-btn {
          padding: 10px 24px;
          background: #16a34a;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .download-modal-btn:hover {
          background: #15803d;
        }

        .action-buttons-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .download-btn {
          background: #16a34a;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .download-btn:hover {
          background: #15803d;
          transform: translateY(-1px);
        }

        .download-btn .material-symbols-outlined {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}