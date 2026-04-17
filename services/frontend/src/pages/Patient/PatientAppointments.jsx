import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/Patient/PatientSidebar";
import "../../styles/Patient/PatientAppointments.css";

export default function PatientAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  const APPOINTMENT_BASE_URL =
    import.meta.env.VITE_API_GATEWAY_URL
      ? `${import.meta.env.VITE_API_GATEWAY_URL}/api/appointments`
      : "http://localhost:5015/api/appointments";

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const storedPatientProfile = localStorage.getItem("patientProfile");
  const patientProfile = storedPatientProfile
    ? JSON.parse(storedPatientProfile)
    : null;

  const patientName =
    patientProfile?.name || patientProfile?.fullName || user?.name || "Patient";
  const patientId = patientProfile?.patientId || user?.patientId || "------";
  const patientEmail = patientProfile?.email || user?.email || "No email";

  // For backend lookup if appointments collection stores auth/user id
  const appointmentPatientId = patientProfile?.userId || user?.id || patientId;

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        "";

      if (!token || !appointmentPatientId) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${APPOINTMENT_BASE_URL}/patient/${appointmentPatientId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : []);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (appointmentId, newDate, newTime) => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        "";

      const response = await fetch(
        `${APPOINTMENT_BASE_URL}/${appointmentId}/reschedule`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            appointmentDate: newDate,
            startTime: newTime,
          }),
        }
      );

      if (response.ok) {
        await fetchAppointments();
        setShowRescheduleModal(false);
        alert("Appointment rescheduled successfully");
      }
    } catch (error) {
      console.error("Failed to reschedule:", error);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken") ||
          "";

        const response = await fetch(
          `${APPOINTMENT_BASE_URL}/${appointmentId}/cancel`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          await fetchAppointments();
          alert("Appointment cancelled successfully");
        }
      } catch (error) {
        console.error("Failed to cancel:", error);
      }
    }
  };

  const handleJoinCall = (appointment) => {
    if (appointment.consultationType === "online") {
      navigate(`/telemedicine/${appointment._id}`);
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedAppointment(null);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = getLocalDateString(date);
    return appointments.filter(
      (apt) =>
        apt.appointmentDate?.split("T")[0] === dateStr &&
        apt.status !== "CANCELLED"
    );
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarDays = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="calendar-day empty"></div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const dateStr = getLocalDateString(currentDate);
      const dayAppointments = getAppointmentsForDate(currentDate);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected =
        selectedCalendarDate &&
        currentDate.toDateString() === selectedCalendarDate.toDateString();

      calendarDays.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? "today" : ""} ${
            isSelected ? "selected" : ""
          } ${dayAppointments.length > 0 ? "has-appointments" : ""}`}
          onClick={() => {
            setSelectedCalendarDate(currentDate);
            const filtered = appointments.filter(
              (apt) => apt.appointmentDate?.split("T")[0] === dateStr
            );
          }}
        >
          <span className="day-number">{day}</span>
          {dayAppointments.length > 0 && (
            <div className="appointment-indicator">
              <span className="dot"></span>
              <span className="count">{dayAppointments.length}</span>
            </div>
          )}
        </div>
      );
    }

    return calendarDays;
  };

  const changeMonth = (increment) => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + increment,
        1
      )
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "green";
      case "PENDING_PAYMENT":
        return "amber";
      case "COMPLETED":
        return "blue";
      case "CANCELLED":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmed";
      case "PENDING_PAYMENT":
        return "Pending Payment";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status) => {
    return status === "PAID" ? "green" : "amber";
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConsultationTypeDisplay = (type) => {
    if (!type) return "Not specified";
    if (type.toLowerCase() === "online") return "Online Consultation";
    if (type.toLowerCase() === "in-person") return "In-Person Visit";
    return type;
  };

  const filterAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedCalendarDate) {
      const selectedDateStr = getLocalDateString(selectedCalendarDate);
      return appointments.filter(
        (apt) => apt.appointmentDate?.split("T")[0] === selectedDateStr
      );
    }

    switch (filter) {
      case "upcoming":
        return appointments.filter(
          (apt) =>
            new Date(apt.appointmentDate) >= today &&
            apt.status !== "CANCELLED"
        );
      case "past":
        return appointments.filter(
          (apt) => new Date(apt.appointmentDate) < today
        );
      case "cancelled":
        return appointments.filter((apt) => apt.status === "CANCELLED");
      default:
        return appointments;
    }
  };

  const getStats = () => {
    const today = new Date();
    return {
      upcoming: appointments.filter(
        (a) => new Date(a.appointmentDate) >= today && a.status !== "CANCELLED"
      ).length,
      completed: appointments.filter((a) => a.status === "COMPLETED").length,
      pending: appointments.filter((a) => a.status === "PENDING_PAYMENT").length,
      cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
    };
  };

  const stats = getStats();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("patientProfile");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div className="patient-appointments-page">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <PatientSidebar
        patientName={patientName}
        patientId={patientId}
        activeItem="appointments"
        onLogout={handleLogout}
      />

      <main className="patient-appointments-main">
        <header className="patient-appointments-topbar">
          <div className="patient-search-wrap">
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Search appointments..." />
          </div>

          <div className="patient-topbar-right">
            <button className="patient-notification-btn">
              <span className="material-symbols-outlined">notifications</span>
              <span className="patient-notification-dot"></span>
            </button>

            <div className="patient-user-box">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrN1LqW-RHmFFNnzzLRJ7P6x0ftJXxcbutPSdcT4NSDdd-JsFNhpz1lczyA_SdmmLQAYJHFDBpRNrfbaB5GdldP2carSUNQ_h8-OqHXyZpC7K1nYi-qhcqbD-GQNMrOwwIEMjnJBl05VTjLVFEafQwmKaPyTNwIcUbWnfrjDnrqG1RLo1zXLDvAbibBvRr-s38ws1atQOvuYZWvzOCEzle4TjBAfYooLOqzy8AdZ5JCG5uAlXzKNnbzVln4WxnXNpRbJhqj-LpgBo"
                alt="patient"
              />
              <div className="patient-user-details">
                <span>{patientName}</span>
                <small>{patientEmail}</small>
              </div>
            </div>
          </div>
        </header>

        <div className="patient-appointments-content">
          <div className="appointments-stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <span className="material-symbols-outlined">event_upcoming</span>
              </div>
              <div className="stat-info">
                <h3>{stats.upcoming}</h3>
                <p>Upcoming</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="stat-info">
                <h3>{stats.completed}</h3>
                <p>Completed</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <span className="material-symbols-outlined">pending</span>
              </div>
              <div className="stat-info">
                <h3>{stats.pending}</h3>
                <p>Pending</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">
                <span className="material-symbols-outlined">cancel</span>
              </div>
              <div className="stat-info">
                <h3>{stats.cancelled}</h3>
                <p>Cancelled</p>
              </div>
            </div>
          </div>

          <div className="appointments-layout">
            <div className="calendar-section">
              <div className="calendar-header">
                <button onClick={() => changeMonth(-1)}>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h3>
                  {currentMonth.toLocaleString("default", { month: "long" })}{" "}
                  {currentMonth.getFullYear()}
                </h3>
                <button onClick={() => changeMonth(1)}>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>

              <div className="calendar-weekdays">
                {weekDays.map((day) => (
                  <div key={day} className="weekday">
                    {day}
                  </div>
                ))}
              </div>

              <div className="calendar-grid">{renderCalendar()}</div>

              {selectedCalendarDate && (
                <div className="selected-date-info">
                  <span className="material-symbols-outlined">event</span>
                  <span>
                    {selectedCalendarDate.toLocaleDateString("default", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <button onClick={() => setSelectedCalendarDate(null)}>
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="appointments-table-section">
            <div className="table-header">
              <h3>Appointment Registry</h3>
              <button
                className="book-new-btn"
                onClick={() => navigate("/appointment")}
              >
                <span className="material-symbols-outlined">add</span>
                Book New
              </button>
            </div>

            {!selectedCalendarDate && (
              <div className="appointments-filter-tabs">
                <button
                  className={filter === "all" ? "active" : ""}
                  onClick={() => setFilter("all")}
                >
                  All Appointments
                </button>
                <button
                  className={filter === "upcoming" ? "active" : ""}
                  onClick={() => setFilter("upcoming")}
                >
                  Upcoming
                </button>
                <button
                  className={filter === "past" ? "active" : ""}
                  onClick={() => setFilter("past")}
                >
                  Past
                </button>
                <button
                  className={filter === "cancelled" ? "active" : ""}
                  onClick={() => setFilter("cancelled")}
                >
                  Cancelled
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading-state">Loading appointments...</div>
            ) : filterAppointments().length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-outlined">calendar_month</span>
                <p>No appointments found</p>
                <button onClick={() => navigate("/appointment")}>
                  Book Your First Appointment
                </button>
              </div>
            ) : (
              <div className="appointments-table-wrapper">
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Doctor Name</th>
                      <th>Doctor Specialty</th>
                      <th>Hospital</th>
                      <th>Appointment Date</th>
                      <th>Appointment Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterAppointments().map((apt) => (
                      <tr key={apt._id}>
                        <td>
                          <div className="doctor-info">
                            <div className="doctor-avatar">
                              {apt.doctorName?.charAt(0) || "D"}
                            </div>
                            <div>
                              <div className="doctor-name">{apt.doctorName}</div>
                            </div>
                          </div>
                        </td>
                        <td>{apt.doctorSpecialty || apt.specialization || "N/A"}</td>
                        <td>{apt.hospital || "N/A"}</td>
                        <td>
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </td>
                        <td>{apt.appointmentTime || apt.startTime || "N/A"}</td>
                        <td>
                          <span
                            className={`status-badge ${getStatusColor(
                              apt.status
                            )}`}
                          >
                            {getStatusText(apt.status)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn view"
                              onClick={() => handleViewDetails(apt)}
                              title="View Details"
                            >
                              <span className="material-symbols-outlined">
                                visibility
                              </span>
                            </button>
                            {apt.status === "CONFIRMED" &&
                              apt.consultationType === "online" && (
                                <button
                                  className="action-btn join"
                                  onClick={() => handleJoinCall(apt)}
                                  title="Join Call"
                                >
                                  <span className="material-symbols-outlined">
                                    videocam
                                  </span>
                                </button>
                              )}
                            {apt.status === "CONFIRMED" && (
                              <button
                                className="action-btn reschedule"
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setShowRescheduleModal(true);
                                }}
                                title="Reschedule"
                              >
                                <span className="material-symbols-outlined">
                                  edit_calendar
                                </span>
                              </button>
                            )}
                            {apt.status !== "CANCELLED" &&
                              apt.status !== "COMPLETED" && (
                                <button
                                  className="action-btn cancel"
                                  onClick={() => handleCancel(apt._id)}
                                  title="Cancel"
                                >
                                  <span className="material-symbols-outlined">
                                    cancel
                                  </span>
                                </button>
                              )}
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

      {/* Attractive View Details Modal */}
      {showViewModal && selectedAppointment && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="appointment-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeViewModal}>
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="modal-header-section">
              <div className="header-icon">
                <span className="material-symbols-outlined">event_available</span>
              </div>
              <h2>Appointment Details</h2>
              <p>Complete information about your medical appointment</p>
            </div>

            <div className="modal-details-grid">
              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">receipt_long</span>
                </div>
                <div className="detail-content">
                  <label>Appointment ID</label>
                  <p>{selectedAppointment.appointmentId || selectedAppointment._id}</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <div className="detail-content">
                  <label>Doctor Name</label>
                  <p>{selectedAppointment.doctorName || "N/A"}</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">science</span>
                </div>
                <div className="detail-content">
                  <label>Doctor Specialty</label>
                  <p>{selectedAppointment.doctorSpecialty || selectedAppointment.specialization || "N/A"}</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">local_hospital</span>
                </div>
                <div className="detail-content">
                  <label>Hospital</label>
                  <p>{selectedAppointment.hospital || "N/A"}</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">videocam</span>
                </div>
                <div className="detail-content">
                  <label>Appointment Type</label>
                  <p>{getConsultationTypeDisplay(selectedAppointment.consultationType)}</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div className="detail-content">
                  <label>Appointment Date</label>
                  <p>{new Date(selectedAppointment.appointmentDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <div className="detail-content">
                  <label>Appointment Time</label>
                  <p>{selectedAppointment.appointmentTime || selectedAppointment.startTime || "N/A"}</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">hourglass_top</span>
                </div>
                <div className="detail-content">
                  <label>Duration</label>
                  <p>{selectedAppointment.duration || "30"} minutes</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">info</span>
                </div>
                <div className="detail-content">
                  <label>Status</label>
                  <span className={`status-badge ${getStatusColor(selectedAppointment.status)}`}>
                    {getStatusText(selectedAppointment.status)}
                  </span>
                </div>
              </div>

              {selectedAppointment.paymentStatus && (
                <div className="detail-card">
                  <div className="detail-icon">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div className="detail-content">
                    <label>Payment Status</label>
                    <span className={`payment-status ${getPaymentStatusColor(selectedAppointment.paymentStatus)}`}>
                      {selectedAppointment.paymentStatus}
                    </span>
                  </div>
                </div>
              )}

              {selectedAppointment.amount && (
                <div className="detail-card highlight">
                  <div className="detail-icon">
                    <span className="material-symbols-outlined">currency_rupee</span>
                  </div>
                  <div className="detail-content">
                    <label>Amount</label>
                    <p className="amount-text">LKR {selectedAppointment.amount.toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">create</span>
                </div>
                <div className="detail-content">
                  <label>Created At</label>
                  <p>{formatDateTime(selectedAppointment.createdAt)}</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <span className="material-symbols-outlined">update</span>
                </div>
                <div className="detail-content">
                  <label>Last Updated</label>
                  <p>{formatDateTime(selectedAppointment.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button className="close-modal-btn" onClick={closeViewModal}>
                <span className="material-symbols-outlined">close</span>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div
          className="modal-overlay"
          onClick={() => setShowRescheduleModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reschedule Appointment</h3>
              <button onClick={() => setShowRescheduleModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select New Date</label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="form-group">
                <label>Select New Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                >
                  <option value="">Select time</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowRescheduleModal(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={() =>
                  handleReschedule(
                    selectedAppointment._id,
                    selectedDate,
                    selectedTime
                  )
                }
                disabled={!selectedTime}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}