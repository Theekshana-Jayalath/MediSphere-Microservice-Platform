import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/Patient/PatientSidebar";
import AppointmentTracker from "../../components/Patient/AppointmentTracker";
import "../../styles/Patient/PatientAppointments.css";
import "../../styles/Patient/AppointmentTracker.css";

export default function PatientAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [trackingAppointment, setTrackingAppointment] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRefundPopup, setShowRefundPopup] = useState(false);
  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [pendingCancelAppointment, setPendingCancelAppointment] = useState(null);

  const APPOINTMENT_BASE_URL =
    import.meta.env.VITE_API_GATEWAY_URL
      ? `${import.meta.env.VITE_API_GATEWAY_URL}/api/appointments`
      : `${import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:5015"}/api/appointments`;

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const storedPatientProfile = localStorage.getItem("patientProfile");
  const patientProfile = storedPatientProfile ? JSON.parse(storedPatientProfile) : null;

  const patientName = patientProfile?.name || patientProfile?.fullName || user?.name || "Patient";
  const patientId = patientProfile?.patientId || user?.patientId || "------";
  const patientEmail = patientProfile?.email || user?.email || "No email";
  const appointmentPatientId = patientProfile?.userId || user?.id || patientId;

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken") || "";
      if (!token || !appointmentPatientId) {
        setAppointments([]);
        setLoading(false);
        return;
      }
      const response = await fetch(`${APPOINTMENT_BASE_URL}/patient/${appointmentPatientId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
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

  const handleCancelClick = (appointmentId) => {
    const appointment = appointments.find(apt => apt._id === appointmentId);
    
    console.log("Cancelling appointment with status:", appointment?.status); // Debug log
    
    // Show refund popup for CONFIRMED appointments
    if (appointment?.status === "CONFIRMED") {
      setPendingCancelAppointment(appointmentId);
      setShowRefundPopup(true);
    } 
    // Show simple confirmation popup for PENDING or PENDING_PAYMENT appointments
    else if (appointment?.status === "PENDING" || appointment?.status === "PENDING_PAYMENT") {
      setPendingCancelAppointment(appointmentId);
      setShowPendingPopup(true);
    }
    // For other statuses, show regular browser confirmation
    else {
      if (window.confirm("Are you sure you want to cancel this appointment?")) {
        cancelAppointment(appointmentId);
      }
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken") || "";
      const response = await fetch(`${APPOINTMENT_BASE_URL}/${appointmentId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchAppointments();
        if (trackingAppointment?._id === appointmentId) {
          setTrackingAppointment((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
        }
        alert("Appointment cancelled successfully");
      } else {
        alert("Failed to cancel appointment. Please try again.");
      }
    } catch (error) {
      console.error("Failed to cancel:", error);
      alert("An error occurred while cancelling the appointment.");
    }
  };

  const handleRefundConfirm = () => {
    if (pendingCancelAppointment) {
      cancelAppointment(pendingCancelAppointment);
      setShowRefundPopup(false);
      setPendingCancelAppointment(null);
    }
  };

  const handleRefundCancel = () => {
    setShowRefundPopup(false);
    setPendingCancelAppointment(null);
  };

  const handlePendingConfirm = () => {
    if (pendingCancelAppointment) {
      cancelAppointment(pendingCancelAppointment);
      setShowPendingPopup(false);
      setPendingCancelAppointment(null);
    }
  };

  const handlePendingCancel = () => {
    setShowPendingPopup(false);
    setPendingCancelAppointment(null);
  };

  const handleTrackAppointment = (appointment) => {
    setTrackingAppointment(appointment);
    setShowTracker(true);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
  };

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = getLocalDateString(date);
    return appointments.filter((apt) => apt.appointmentDate?.split("T")[0] === dateStr && apt.status !== "CANCELLED");
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const calendarDays = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayAppointments = getAppointmentsForDate(currentDate);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected = selectedCalendarDate && currentDate.toDateString() === selectedCalendarDate.toDateString();
      const hasApps = dayAppointments.length > 0;

      calendarDays.push(
        <div
          key={day}
          className={`cal-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${hasApps ? "has-events" : ""}`}
          onClick={() => {
            setSelectedCalendarDate(currentDate);
            if (hasApps) {
              setTrackingAppointment(dayAppointments[0]);
              setShowTracker(true);
            }
          }}
        >
          <span className="cal-day-num">{day}</span>
          {hasApps && <span className="cal-dot"></span>}
        </div>
      );
    }
    return calendarDays;
  };

  const changeMonth = (increment) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "CONFIRMED": return "confirmed";
      case "PENDING": 
      case "PENDING_PAYMENT": return "pending-pay";
      case "COMPLETED": return "completed";
      case "CANCELLED": return "cancelled";
      default: return "";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "CONFIRMED": return "Confirmed";
      case "PENDING": 
      case "PENDING_PAYMENT": return "Pending";
      case "COMPLETED": return "Completed";
      case "CANCELLED": return "Cancelled";
      default: return status;
    }
  };

  const filterAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let filtered = appointments;

    if (selectedCalendarDate) {
      const selectedDateStr = getLocalDateString(selectedCalendarDate);
      filtered = filtered.filter((apt) => apt.appointmentDate?.split("T")[0] === selectedDateStr);
    }

    switch (filter) {
      case "upcoming":
        filtered = filtered.filter((apt) => new Date(apt.appointmentDate) >= today && apt.status !== "CANCELLED");
        break;
      case "past":
        filtered = filtered.filter((apt) => new Date(apt.appointmentDate) < today);
        break;
      case "cancelled":
        filtered = filtered.filter((apt) => apt.status === "CANCELLED");
        break;
      default: break;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.doctorName?.toLowerCase().includes(term) ||
          apt.specialization?.toLowerCase().includes(term) ||
          apt.hospital?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const getStats = () => {
    const today = new Date();
    return {
      upcoming: appointments.filter((a) => new Date(a.appointmentDate) >= today && a.status !== "CANCELLED").length,
      completed: appointments.filter((a) => a.status === "COMPLETED").length,
      pending: appointments.filter((a) => a.status === "PENDING" || a.status === "PENDING_PAYMENT").length,
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
  const filteredAppointments = filterAppointments();

  return (
    <div className="apt-page">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />

      <PatientSidebar patientName={patientName} patientId={patientId} activeItem="appointments" onLogout={handleLogout} />

      <main className="apt-main">
        {/* Top Bar */}
        <header className="apt-topbar">
          <div className="apt-search">
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Search appointments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && (
              <button className="apt-search-clear" onClick={() => setSearchTerm("")}>
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
          <div className="apt-topbar-right">
            <button className="apt-icon-btn">
              <span className="material-symbols-outlined">notifications</span>
              <span className="apt-badge"></span>
            </button>
            <div className="apt-user">
              <div className="apt-avatar">{patientName?.charAt(0) || "P"}</div>
              <div className="apt-user-meta">
                <span className="apt-user-name">{patientName}</span>
                <span className="apt-user-email">{patientEmail}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="apt-content">
          {/* Stats */}
          <div className="apt-stats">
            <div className="apt-stat">
              <div className="apt-stat-icon upcoming"><span className="material-symbols-outlined">event_upcoming</span></div>
              <div><h2>{stats.upcoming}</h2><p>Upcoming</p></div>
            </div>
            <div className="apt-stat">
              <div className="apt-stat-icon done"><span className="material-symbols-outlined">check_circle</span></div>
              <div><h2>{stats.completed}</h2><p>Completed</p></div>
            </div>
            <div className="apt-stat">
              <div className="apt-stat-icon wait"><span className="material-symbols-outlined">pending</span></div>
              <div><h2>{stats.pending}</h2><p>Pending</p></div>
            </div>
            <div className="apt-stat">
              <div className="apt-stat-icon cancel"><span className="material-symbols-outlined">cancel</span></div>
              <div><h2>{stats.cancelled}</h2><p>Cancelled</p></div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="apt-grid">
            {/* LEFT: Registry */}
            <div className="apt-registry">
              <div className="apt-registry-card">
                <div className="apt-registry-head">
                  <h2>Appointment Registry</h2>
                  <button className="apt-btn-primary" onClick={() => navigate("/appointment")}>
                    <span className="material-symbols-outlined">add</span>Book New
                  </button>
                </div>

                {!selectedCalendarDate && (
                  <div className="apt-tabs">
                    {["all", "upcoming", "past", "cancelled"].map((tab) => (
                      <button key={tab} className={`apt-tab ${filter === tab ? "active" : ""}`} onClick={() => setFilter(tab)}>
                        {tab === "all" ? "All Appointments" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="apt-table-wrap">
                  {loading ? (
                    <div className="apt-empty">
                      <span className="material-symbols-outlined apt-spin">sync</span>
                      <p>Loading appointments...</p>
                    </div>
                  ) : filteredAppointments.length === 0 ? (
                    <div className="apt-empty">
                      <span className="material-symbols-outlined">calendar_month</span>
                      <p>No appointments found</p>
                      {!searchTerm && <button onClick={() => navigate("/appointment")}>Book Your First Appointment</button>}
                    </div>
                  ) : (
                    <table className="apt-table">
                      <thead>
                        <tr>
                          <th>DOCTOR</th>
                          <th>TYPE</th>
                          <th>DATE & TIME</th>
                          <th>STATUS</th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((apt) => {
                          const isTracked = trackingAppointment?._id === apt._id;
                          return (
                            <tr key={apt._id} className={`${isTracked ? "row-tracked" : ""}`}>
                              <td>
                                <div className="apt-doc">
                                  <div className="apt-doc-av" style={{ background: getAvatarColor(apt.doctorName) }}>
                                    {apt.doctorName?.charAt(0) || "D"}
                                  </div>
                                  <div>
                                    <div className="apt-doc-name">{apt.doctorName}</div>
                                    <div className="apt-doc-sp">{apt.specialization}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`apt-type-tag ${apt.consultationType?.toLowerCase()}`}>
                                  {apt.consultationType === "online" ? "Online" : "In-Person"}
                                </span>
                              </td>
                              <td>
                                <div className="apt-dt">
                                  {new Date(apt.appointmentDate).toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}
                                  <span className="apt-tm">{apt.startTime}</span>
                                </div>
                              </td>
                              <td>
                                <span className={`apt-status ${getStatusClass(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                              </td>
                              <td>
                                <div className="apt-actions">
                                  <button
                                    className={`apt-act-track ${isTracked ? "active" : ""}`}
                                    onClick={() => handleTrackAppointment(apt)}
                                    title={isTracked ? "Currently Tracking" : "Track Appointment"}
                                  >
                                    <span className="material-symbols-outlined">{isTracked ? "visibility" : "visibility"}</span>
                                    {isTracked ? "Tracking" : "Track"}
                                  </button>
                                  <div className="apt-act-icons">
                                    <button 
                                      className="apt-act-icon del" 
                                      onClick={() => handleCancelClick(apt._id)} 
                                      title={apt.status === "CANCELLED" || apt.status === "COMPLETED" ? "Cannot cancel" : "Cancel"}
                                      disabled={apt.status === "CANCELLED" || apt.status === "COMPLETED"}
                                      style={{
                                        opacity: apt.status === "CANCELLED" || apt.status === "COMPLETED" ? 0.5 : 1,
                                        cursor: apt.status === "CANCELLED" || apt.status === "COMPLETED" ? "not-allowed" : "pointer"
                                      }}
                                    >
                                      <span className="material-symbols-outlined">cancel</span>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Calendar + Tracker */}
            <div className="apt-sidebar">
              <div className="apt-cal-card">
                <div className="apt-cal-nav">
                  <button onClick={() => changeMonth(-1)}><span className="material-symbols-outlined">chevron_left</span></button>
                  <h3>{currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}</h3>
                  <button onClick={() => changeMonth(1)}><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
                <div className="apt-cal-weekdays">
                  {weekDays.map((d) => <div key={d}>{d}</div>)}
                </div>
                <div className="apt-cal-grid">{renderCalendar()}</div>
                {selectedCalendarDate && (
                  <div className="apt-cal-selected">
                    <span className="material-symbols-outlined">event</span>
                    <span>{selectedCalendarDate.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                    <button onClick={() => setSelectedCalendarDate(null)}>Clear</button>
                  </div>
                )}
              </div>

              {showTracker && trackingAppointment && (
                <AppointmentTracker
                  status={trackingAppointment.status}
                  appointment={trackingAppointment}
                  onClose={() => { setShowTracker(false); setTrackingAppointment(null); }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Refund Popup Modal - For CONFIRMED appointments */}
      {showRefundPopup && (
        <div className="refund-popup-overlay" onClick={handleRefundCancel}>
          <div className="refund-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="refund-popup-header">
              <span className="material-symbols-outlined">refund</span>
              <h3>Cancel Appointment & Request Refund</h3>
            </div>
            <div className="refund-popup-body">
              <p>Are you sure you want to cancel this confirmed appointment?</p>
              <div className="refund-notice">
                <span className="material-symbols-outlined">info</span>
                <div className="refund-notice-text">
                  <strong>Refund Policy:</strong>
                  <ul>
                    <li>✓ Full refund if cancelled at least 24 hours before appointment</li>
                    <li>✗ No refund for cancellations within 24 hours of appointment time</li>
                    <li>💰 Refund will be processed to your original payment method within 5-7 business days</li>
                  </ul>
                </div>
              </div>
              <p className="refund-confirm-question">Do you wish to proceed with cancellation?</p>
            </div>
            <div className="refund-popup-footer">
              <button className="refund-btn-cancel" onClick={handleRefundCancel}>
                No, Keep Appointment
              </button>
              <button className="refund-btn-confirm" onClick={handleRefundConfirm}>
                Yes, Cancel & Request Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Confirmation Popup - For PENDING appointments */}
      {showPendingPopup && (
        <div className="pending-popup-overlay" onClick={handlePendingCancel}>
          <div className="pending-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="pending-popup-header">
              <span className="material-symbols-outlined">warning</span>
              <h3>Cancel Appointment</h3>
            </div>
            <div className="pending-popup-body">
              <p>Are you sure you want to cancel this pending appointment?</p>
              <p className="pending-note">This action cannot be undone.</p>
            </div>
            <div className="pending-popup-footer">
              <button className="pending-btn-cancel" onClick={handlePendingCancel}>
                No, Go Back
              </button>
              <button className="pending-btn-confirm" onClick={handlePendingConfirm}>
                Yes, Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getAvatarColor(name) {
  const colors = ["#1d2d44", "#344966", "#3a5a7c", "#2e4a6e", "#1a3650", "#2d4a5e", "#4a6b8a"];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}