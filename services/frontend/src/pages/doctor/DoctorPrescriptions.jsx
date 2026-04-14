import { useEffect, useMemo, useState } from "react";
import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import PrescriptionCardList from "../../components/doctor/PrescriptionCardList";
import {
  deletePrescription,
  getAllPrescriptions,
} from "../../services/doctor/prescriptionApi";
import { downloadPrescriptionPdf } from "../../utils/prescriptionPdf";
import "../../styles/Doctor/doctorPrescriptions.css";

const DoctorPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchPrescriptions = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await getAllPrescriptions();
      const fetchedPrescriptions = response.data || [];

      setPrescriptions(fetchedPrescriptions);

      if (selectedPrescription) {
        const updatedSelectedPrescription = fetchedPrescriptions.find(
          (item) => (item._id || item.id) === (selectedPrescription._id || selectedPrescription.id)
        );
        setSelectedPrescription(updatedSelectedPrescription || null);
      }

      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load prescriptions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const normalizeStatus = (status) => {
    if (!status) return "Active";

    const normalized = status.toString().trim().toLowerCase();

    if (normalized === "active") return "Active";
    if (normalized === "completed") return "Completed";
    if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";

    return status;
  };

  const getDoctorName = (prescription) => {
    if (typeof prescription?.doctorId === "object" && prescription?.doctorId?.fullName) {
      return prescription.doctorId.fullName;
    }

    return prescription?.doctorName || "Dr. Unknown";
  };

  const getPatientName = (prescription) => {
    return prescription?.patientName || "Unknown Patient";
  };

  const getAppointmentId = (prescription) => {
    if (typeof prescription?.appointmentId === "object" && prescription?.appointmentId?._id) {
      return prescription.appointmentId._id;
    }

    return prescription?.appointmentId || "N/A";
  };

  const getIssuedDate = (prescription) => {
    const rawDate = prescription?.issuedDate || prescription?.createdAt;

    if (!rawDate) return "N/A";

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return parsedDate.toLocaleDateString("en-CA");
  };

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((prescription) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        getDoctorName(prescription).toLowerCase().includes(query) ||
        getPatientName(prescription).toLowerCase().includes(query) ||
        String(getAppointmentId(prescription)).toLowerCase().includes(query) ||
        (prescription?.diagnosis || "").toLowerCase().includes(query);

      const currentStatus = normalizeStatus(prescription?.status);
      const matchesStatus =
        statusFilter === "All" || currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, searchTerm, statusFilter]);

  const handleDelete = async (id) => {
    try {
      setError("");
      setMessage("");

      const response = await deletePrescription(id);
      setMessage(response.message || "Prescription deleted successfully");

      if (selectedPrescription && (selectedPrescription._id || selectedPrescription.id) === id) {
        setSelectedPrescription(null);
      }

      fetchPrescriptions(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete prescription");
    }
  };

  const handleDownload = (prescription) => {
    try {
      setError("");
      setMessage("");
      downloadPrescriptionPdf(prescription);
      setMessage("Prescription report downloaded successfully");
    } catch (err) {
      setError(err.message || "Failed to generate prescription PDF");
    }
  };

  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "Active") return "status-active";
    if (normalized === "Completed") return "status-completed";
    if (normalized === "Cancelled") return "status-cancelled";

    return "status-active";
  };

  return (
    <div className="doctor-prescriptions-layout">
      <DoctorSidebar />

      <main className="doctor-prescriptions-main">
        <div className="doctor-prescriptions-topbar">
          <div>
            <h1 className="doctor-prescriptions-title">Doctor Prescriptions</h1>
            <p className="doctor-prescriptions-subtitle">
              Search, review, manage, and download prescriptions in a modern clinical workspace.
            </p>
          </div>

          <div className="doctor-prescriptions-topbar-actions">
            <div className="doctor-prescriptions-stat-card">
              <span>Total Prescriptions</span>
              <strong>{prescriptions.length}</strong>
            </div>

            <button
              type="button"
              className="doctor-prescriptions-refresh-btn"
              onClick={() => fetchPrescriptions(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {message && (
          <div className="doctor-prescriptions-alert success">{message}</div>
        )}

        {error && (
          <div className="doctor-prescriptions-alert error">{error}</div>
        )}

        <section className="doctor-prescriptions-controls-card">
          <div className="doctor-prescriptions-search-box">
            <input
              type="text"
              placeholder="Search by doctor, patient, appointment ID, or diagnosis..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="doctor-prescriptions-filter-box">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </section>

        <section className="doctor-prescriptions-content-grid">
          <div className="doctor-prescriptions-content-card">
            <div className="doctor-prescriptions-card-header">
              <h2>Prescription Records</h2>
              <p>Browse all available prescription entries in card format.</p>
            </div>

            {isLoading ? (
              <div className="doctor-prescriptions-loading-state">
                Loading prescriptions...
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="doctor-prescriptions-empty-state">
                <div className="doctor-prescriptions-empty-icon">💊</div>
                <h3>No Prescriptions Found</h3>
                <p>No matching prescriptions were found for your search or filter.</p>
              </div>
            ) : (
              <PrescriptionCardList
                prescriptions={filteredPrescriptions}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onSelect={setSelectedPrescription}
                selectedPrescription={selectedPrescription}
              />
            )}
          </div>

          <div className="doctor-prescription-details-card">
            <div className="doctor-prescriptions-card-header">
              <h2>Prescription Details</h2>
              <p>
                {selectedPrescription
                  ? "Preview of the selected prescription"
                  : "Select a prescription card to review its details"}
              </p>
            </div>

            {selectedPrescription ? (
              <div className="doctor-prescription-detail-panel">
                <div className="doctor-prescription-detail-icon">🧾</div>

                <h3>{getPatientName(selectedPrescription)}</h3>

                <span
                  className={`doctor-prescription-status-badge ${getStatusClass(
                    selectedPrescription?.status
                  )}`}
                >
                  {normalizeStatus(selectedPrescription?.status)}
                </span>

                <div className="doctor-prescription-detail-grid">
                  <div className="doctor-prescription-detail-box">
                    <span>Doctor</span>
                    <strong>{getDoctorName(selectedPrescription)}</strong>
                  </div>

                  <div className="doctor-prescription-detail-box">
                    <span>Appointment ID</span>
                    <strong>{String(getAppointmentId(selectedPrescription))}</strong>
                  </div>

                  <div className="doctor-prescription-detail-box">
                    <span>Issued Date</span>
                    <strong>{getIssuedDate(selectedPrescription)}</strong>
                  </div>

                  <div className="doctor-prescription-detail-box">
                    <span>Medicines</span>
                    <strong>{selectedPrescription?.medicines?.length || 0}</strong>
                  </div>
                </div>

                <div className="doctor-prescription-info-section">
                  <h4>Diagnosis</h4>
                  <p>{selectedPrescription?.diagnosis || "No diagnosis available"}</p>
                </div>

                <div className="doctor-prescription-info-section">
                  <h4>Notes</h4>
                  <p>{selectedPrescription?.notes || "No additional notes available"}</p>
                </div>

                <div className="doctor-prescription-info-section">
                  <h4>Medicines</h4>
                  <div className="doctor-prescription-medicine-list">
                    {(selectedPrescription?.medicines || []).length > 0 ? (
                      selectedPrescription.medicines.map((medicine, index) => (
                        <div className="doctor-prescription-medicine-item" key={index}>
                          <strong>{medicine.medicineName || "Medicine"}</strong>
                          <span>
                            {medicine.dosage || "No dosage"}
                            {medicine.frequency ? ` • ${medicine.frequency}` : ""}
                            {medicine.duration ? ` • ${medicine.duration}` : ""}
                          </span>
                          {medicine.instructions && (
                            <p>{medicine.instructions}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="doctor-prescription-no-medicine">
                        No medicine details available.
                      </p>
                    )}
                  </div>
                </div>

                <div className="doctor-prescription-detail-actions">
                  <button
                    type="button"
                    className="doctor-prescription-download-btn"
                    onClick={() => handleDownload(selectedPrescription)}
                  >
                    Download Report
                  </button>

                  <button
                    type="button"
                    className="doctor-prescription-delete-btn"
                    onClick={() =>
                      handleDelete(selectedPrescription._id || selectedPrescription.id)
                    }
                  >
                    Delete Prescription
                  </button>
                </div>
              </div>
            ) : (
              <div className="doctor-prescription-detail-empty">
                <div className="doctor-prescription-detail-empty-icon">🩺</div>
                <p>Select a prescription card from the left side to review the full report.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorPrescriptions;