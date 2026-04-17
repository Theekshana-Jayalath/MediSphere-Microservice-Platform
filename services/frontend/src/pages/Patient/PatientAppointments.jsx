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
  const patientProfile = storedPatientProfile ? JSON.parse(storedPatientProfile) : null;
  
  const patientName = patientProfile?.name || patientProfile?.fullName || user?.name || "Patient";
  const patientId = patientProfile?.patientId || user?.patientId || "------";
  const patientEmail = patientProfile?.email || user?.email || "No email";

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${APPOINTMENT_BASE_URL}/patient/${patientId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (appointmentId, newDate, newTime) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${APPOINTMENT_BASE_URL}/${appointmentId}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentDate: newDate,
          startTime: newTime,
        }),
      });

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
        const token = localStorage.getItem("token");
        const response = await fetch(`${APPOINTMENT_BASE_URL}/${appointmentId}/cancel`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

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
    if (appointment.appointmentType === "ONLINE") {
      navigate(`/telemedicine/${appointment._id}`);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => 
      apt.appointmentDate?.split('T')[0] === dateStr && 
      apt.status !== "CANCELLED"
    );
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayAppointments = getAppointmentsForDate(currentDate);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected = selectedCalendarDate && currentDate.toDateString() === selectedCalendarDate.toDateString();
      
      calendarDays.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayAppointments.length > 0 ? 'has-appointments' : ''}`}
          onClick={() => {
            setSelectedCalendarDate(currentDate);
            const filtered = appointments.filter(apt => 
              apt.appointmentDate?.split('T')[0] === dateStr
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
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED": return "green";
      case "PENDING_PAYMENT": return "amber";
      case "COMPLETED": return "blue";
      case "CANCELLED": return "red";
      default: return "gray";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "CONFIRMED": return "Confirmed";
      case "PENDING_PAYMENT": return "Pending Payment";
      case "COMPLETED": return "Completed";
      case "CANCELLED": return "Cancelled";
      default: return status;
    }
  };

  const getPaymentStatusColor = (status) => {
    return status === "PAID" ? "green" : "amber";
  };

  const filterAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedCalendarDate) {
      const selectedDateStr = selectedCalendarDate.toISOString().split('T')[0];
      return appointments.filter(apt => apt.appointmentDate?.split('T')[0] === selectedDateStr);
    }
    
    switch (filter) {
      case "upcoming":
        return appointments.filter(apt => new Date(apt.appointmentDate) >= today && apt.status !== "CANCELLED");
      case "past":
        return appointments.filter(apt => new Date(apt.appointmentDate) < today);
      case "cancelled":
        return appointments.filter(apt => apt.status === "CANCELLED");
      default:
        return appointments;
    }
  };

  const getStats = () => {
    const today = new Date();
    return {
      upcoming: appointments.filter(a => new Date(a.appointmentDate) >= today && a.status !== "CANCELLED").length,
      completed: appointments.filter(a => a.status === "COMPLETED").length,
      pending: appointments.filter(a => a.status === "PENDING_PAYMENT").length,
      cancelled: appointments.filter(a => a.status === "CANCELLED").length,
    };
  };

  const stats = getStats();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("patientProfile");
    localStorage.removeItem("token");
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
                  {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
                </h3>
                <button onClick={() => changeMonth(1)}>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              
              <div className="calendar-weekdays">
                {weekDays.map(day => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
              
              <div className="calendar-grid">
                {renderCalendar()}
              </div>
              
              {selectedCalendarDate && (
                <div className="selected-date-info">
                  <span className="material-symbols-outlined">event</span>
                  <span>{selectedCalendarDate.toLocaleDateString('default', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                  <button onClick={() => setSelectedCalendarDate(null)}>Clear</button>
                </div>
              )}
            </div>

            <div className="appointments-table-section">
              <div className="table-header">
                <h3>Appointment Registry</h3>
                <button className="book-new-btn" onClick={() => navigate("/appointment")}>
                  <span className="material-symbols-outlined">add</span>
                  Book New
                </button>
              </div>

              {!selectedCalendarDate && (
                <div className="appointments-filter-tabs">
                  <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
                    All Appointments
                  </button>
                  <button className={filter === "upcoming" ? "active" : ""} onClick={() => setFilter("upcoming")}>
                    Upcoming
                  </button>
                  <button className={filter === "past" ? "active" : ""} onClick={() => setFilter("past")}>
                    Past
                  </button>
                  <button className={filter === "cancelled" ? "active" : ""} onClick={() => setFilter("cancelled")}>
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
                  <button onClick={() => navigate("/appointment")}>Book Your First Appointment</button>
                </div>
              ) : (
                <div className="appointments-table-wrapper">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Specialization</th>
                        <th>Type</th>
                        <th>Date & Time</th>
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
                                <div className="hospital-name">{apt.hospital}</div>
                              </div>
                            </div>
                          </td>
                          <td>{apt.specialization}</td>
                          <td>
                            <span className={`appointment-type ${apt.appointmentType?.toLowerCase()}`}>
                              {apt.appointmentType === "ONLINE" ? "Online" : "In-Person"}
                            </span>
                          </td>
                          <td>
                            <div className="date-time">
                              <div>{new Date(apt.appointmentDate).toLocaleDateString()}</div>
                              <div className="time">{apt.startTime}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusColor(apt.status)}`}>
                              {getStatusText(apt.status)}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {apt.status === "CONFIRMED" && apt.appointmentType === "ONLINE" && (
                                <button className="action-btn join" onClick={() => handleJoinCall(apt)}>
                                  <span className="material-symbols-outlined">videocam</span>
                                </button>
                              )}
                              {apt.status === "CONFIRMED" && (
                                <button className="action-btn reschedule" onClick={() => {
                                  setSelectedAppointment(apt);
                                  setShowRescheduleModal(true);
                                }}>
                                  <span className="material-symbols-outlined">edit_calendar</span>
                                </button>
                              )}
                              {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                                <button className="action-btn cancel" onClick={() => handleCancel(apt._id)}>
                                  <span className="material-symbols-outlined">cancel</span>
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
        </div>
      </main>

      {showRescheduleModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
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
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label>Select New Time</label>
                <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
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
              <button className="cancel-btn" onClick={() => setShowRescheduleModal(false)}>Cancel</button>
              <button 
                className="confirm-btn" 
                onClick={() => handleReschedule(selectedAppointment._id, selectedDate, selectedTime)}
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