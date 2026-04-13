import { useEffect, useMemo, useState } from "react";
import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import {
  getAllAppointments,
  updateAppointmentStatus,
} from "../../services/doctor/appointmentApi.js";
import "../../styles/Doctor/doctorAppointments.css";

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getAllAppointments();
      const fetchedAppointments = Array.isArray(response.data) ? response.data : [];

      setAppointments(fetchedAppointments);

      if (selectedAppointment) {
        const updatedSelectedAppointment = fetchedAppointments.find(
          (appointment) => getAppointmentId(appointment) === getAppointmentId(selectedAppointment)
        );

        setSelectedAppointment(updatedSelectedAppointment || null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load appointments."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getAppointmentId = (appointment) => {
    return appointment?._id || appointment?.id;
  };

  const normalizeStatus = (status) => {
    if (!status) return "Pending";

    const upperStatus = status.toString().trim().toUpperCase();

    switch (upperStatus) {
      case "PENDING":
      case "PENDING_PAYMENT":
      case "PENDING_DOCTOR_APPROVAL":
        return "Pending";

      case "CONFIRMED":
        return "Confirmed";

      case "COMPLETED":
        return "Completed";

      case "CANCELLED":
      case "CANCELED":
      case "REJECTED":
        return "Cancelled";

      default:
        return status;
    }
  };

  const formatAppointmentDate = (appointment) => {
    const rawDate =
      appointment?.appointmentDate ||
      appointment?.date;

    if (!rawDate) return "No date";

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return parsedDate.toLocaleDateString("en-CA");
  };

  const formatAppointmentTime = (appointment) => {
    return (
      appointment?.appointmentTime ||
      appointment?.startTime ||
      appointment?.time ||
      "No time"
    );
  };

  const getAppointmentType = (appointment) => {
    const rawType =
      appointment?.appointmentType ||
      appointment?.type ||
      "In-Person";

    const upperType = rawType.toString().trim().toUpperCase();

    if (upperType === "ONLINE") return "Video Call";
    if (upperType === "PHYSICAL") return "In-Person";

    return rawType;
  };

  const getPatientName = (appointment) => {
    return (
      appointment?.patientName ||
      appointment?.patient?.name ||
      "Unknown Patient"
    );
  };

  const getHospitalName = (appointment) => {
    return appointment?.hospital || "Not specified";
  };

  const getReason = (appointment) => {
    return appointment?.reason || "No consultation reason provided";
  };

  const getPatientAge = (appointment) => {
    return appointment?.patientAge || appointment?.age || "N/A";
  };

  const getPatientGender = (appointment) => {
    return appointment?.gender || appointment?.patientGender || "N/A";
  };

  const getPatientContact = (appointment) => {
    return appointment?.contact || appointment?.phone || "Not available";
  };

  const getPatientEmail = (appointment) => {
    return appointment?.patientEmail || appointment?.email || "Not available";
  };

  const handleAccept = async (appointmentId) => {
    try {
      setIsUpdating(true);
      setMessage("");
      setError("");

      await updateAppointmentStatus(appointmentId, "confirmed");
      await fetchAppointments();
      setMessage("Appointment accepted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to accept appointment."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (appointmentId) => {
    try {
      setIsUpdating(true);
      setMessage("");
      setError("");

      await updateAppointmentStatus(appointmentId, "cancelled");
      await fetchAppointments();
      setMessage("Appointment rejected successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to reject appointment."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const normalizedStatus = normalizeStatus(appointment.status);
      const matchesTab = activeTab === "All" || normalizedStatus === activeTab;

      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        getPatientName(appointment).toLowerCase().includes(query) ||
        getReason(appointment).toLowerCase().includes(query) ||
        getHospitalName(appointment).toLowerCase().includes(query) ||
        getAppointmentType(appointment).toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [appointments, activeTab, searchTerm]);

  const getStatusClass = (status) => {
    switch (normalizeStatus(status)) {
      case "Pending":
        return "status-pending";
      case "Confirmed":
        return "status-confirmed";
      case "Completed":
        return "status-completed";
      case "Cancelled":
        return "status-cancelled";
      default:
        return "";
    }
  };

  return (
    <div className="doctor-appointments-layout">
      <DoctorSidebar />

      <main className="doctor-appointments-main">
        <div className="appointments-topbar">
          <div>
            <h1 className="appointments-page-title">Appointment Requests</h1>
            <p className="appointments-page-subtitle">
              Review pending requests, confirm consultations, and view patient
              appointment details in one place.
            </p>
          </div>

          <div className="appointments-stat-pill">
            <span>Total Appointments</span>
            <strong>{appointments.length}</strong>
          </div>
        </div>

        {message && <div className="appointments-message">{message}</div>}
        {error && <div className="appointments-error-message">{error}</div>}

        <section className="appointments-controls-card">
          <div className="appointments-tabs">
            {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`appointments-tab ${
                    activeTab === tab ? "active-tab" : ""
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              )
            )}
          </div>

          <div className="appointments-search-box">
            <input
              type="text"
              placeholder="Search by patient, reason, hospital, or type..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </section>

        <section className="appointments-content-grid">
          <div className="appointments-list-card">
            <div className="appointments-card-header">
              <h2>Appointments</h2>
              <p>Manage your consultation workflow efficiently</p>
            </div>

            {isLoading ? (
              <div className="appointments-empty-state">Loading appointments...</div>
            ) : (
              <div className="appointments-list">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment) => {
                    const appointmentId = getAppointmentId(appointment);
                    const normalizedStatus = normalizeStatus(appointment.status);

                    return (
                      <div
                        className="appointment-request-card"
                        key={appointmentId}
                      >
                        <div className="appointment-request-top">
                          <div className="appointment-patient-avatar">
                            {getPatientName(appointment).charAt(0)}
                          </div>

                          <div className="appointment-main-info">
                            <div className="appointment-heading-row">
                              <h3>{getPatientName(appointment)}</h3>
                              <span
                                className={`appointment-status ${getStatusClass(
                                  appointment.status
                                )}`}
                              >
                                {normalizedStatus}
                              </span>
                            </div>

                            <p className="appointment-meta">
                              {formatAppointmentDate(appointment)} •{" "}
                              {formatAppointmentTime(appointment)} •{" "}
                              {getAppointmentType(appointment)}
                            </p>

                            <p className="appointment-reason">
                              {getReason(appointment)}
                            </p>

                            <p className="appointment-hospital">
                              📍 {getHospitalName(appointment)}
                            </p>
                          </div>
                        </div>

                        <div className="appointment-request-actions">
                          <button
                            type="button"
                            className="view-details-btn"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            View Details
                          </button>

                          {normalizedStatus === "Pending" && (
                            <>
                              <button
                                type="button"
                                className="accept-btn"
                                onClick={() => handleAccept(appointmentId)}
                                disabled={isUpdating}
                              >
                                Accept
                              </button>

                              <button
                                type="button"
                                className="reject-btn"
                                onClick={() => handleReject(appointmentId)}
                                disabled={isUpdating}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="appointments-empty-state">
                    No appointments found for the selected filter.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="appointments-details-card">
            <div className="appointments-card-header">
              <h2>Patient Details</h2>
              <p>
                {selectedAppointment
                  ? "Selected appointment information"
                  : "Select an appointment to view patient details"}
              </p>
            </div>

            {selectedAppointment ? (
              <div className="patient-detail-panel">
                <div className="patient-detail-avatar">
                  {getPatientName(selectedAppointment).charAt(0)}
                </div>

                <h3>{getPatientName(selectedAppointment)}</h3>

                <span
                  className={`appointment-status large-status ${getStatusClass(
                    selectedAppointment.status
                  )}`}
                >
                  {normalizeStatus(selectedAppointment.status)}
                </span>

                <div className="patient-detail-grid">
                  <div className="detail-box">
                    <span>Age</span>
                    <strong>{getPatientAge(selectedAppointment)}</strong>
                  </div>

                  <div className="detail-box">
                    <span>Gender</span>
                    <strong>{getPatientGender(selectedAppointment)}</strong>
                  </div>

                  <div className="detail-box">
                    <span>Appointment Type</span>
                    <strong>{getAppointmentType(selectedAppointment)}</strong>
                  </div>

                  <div className="detail-box">
                    <span>Hospital</span>
                    <strong>{getHospitalName(selectedAppointment)}</strong>
                  </div>
                </div>

                <div className="patient-contact-section">
                  <h4>Contact Information</h4>
                  <p>📞 {getPatientContact(selectedAppointment)}</p>
                  <p>✉ {getPatientEmail(selectedAppointment)}</p>
                </div>

                <div className="patient-contact-section">
                  <h4>Consultation Reason</h4>
                  <p>{getReason(selectedAppointment)}</p>
                </div>

                <div className="patient-contact-section">
                  <h4>Schedule</h4>
                  <p>
                    {formatAppointmentDate(selectedAppointment)} at{" "}
                    {formatAppointmentTime(selectedAppointment)}
                  </p>
                </div>

                {normalizeStatus(selectedAppointment.status) === "Pending" && (
                  <div className="patient-detail-actions">
                    <button
                      type="button"
                      className="accept-btn"
                      onClick={() => handleAccept(getAppointmentId(selectedAppointment))}
                      disabled={isUpdating}
                    >
                      Accept Appointment
                    </button>

                    <button
                      type="button"
                      className="reject-btn"
                      onClick={() => handleReject(getAppointmentId(selectedAppointment))}
                      disabled={isUpdating}
                    >
                      Reject Appointment
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="patient-details-empty">
                <div className="patient-details-empty-icon">🩺</div>
                <p>
                  Select an appointment card from the left panel to review the
                  patient details here.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorAppointments;