import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import "../../styles/Doctor/doctorDashboard.css";

import {
  doctorProfile,
  todayAppointments,
  pendingRequests,
  availabilitySlots,
  dashboardStats,
  aiInsight,
} from "../../data/doctorDashboardData";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [calendarDays, setCalendarDays] = useState([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [timeSlots, setTimeSlots] = useState(availabilitySlots);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [activeSlotAction, setActiveSlotAction] = useState("");
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [formData, setFormData] = useState({
    time: "",
    hospital: "",
    location: "",
    department: "",
    capacity: "",
    type: "In-Person",
  });
  const [editingSlotId, setEditingSlotId] = useState(null);

  // Update calendar on component mount and when date changes
  useEffect(() => {
    updateCalendar();
    const timer = setInterval(updateCalendar, 86400000); // Update daily (24 hours)
    return () => clearInterval(timer);
  }, []);

  const updateCalendar = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.getDate());
    generateCalendarDays(today);
  };

  const generateCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of the month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Create month label
    const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    setMonthLabel(monthName);

    // Build calendar array
    const days = [];
    
    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        isToday: i === date.getDate() && month === new Date().getMonth() && year === new Date().getFullYear(),
      });
    }

    // Next month's days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    setCalendarDays(days);
  };

  const getAvailableSlotsForDate = (date) => {
    // Return available time slots (can be extended to filter by date logic)
    return timeSlots;
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const handleAddSlot = () => {
    setEditingSlotId(null);
    setFormData({
      time: "",
      hospital: "",
      location: "",
      department: "",
      capacity: "",
      type: "In-Person",
    });
    setShowSlotForm(true);
  };

  const handleEditSlot = (slot) => {
    setEditingSlotId(slot.id);
    setFormData({
      time: slot.time,
      hospital: slot.hospital,
      location: slot.location,
      department: slot.department,
      capacity: slot.capacity,
      type: slot.type,
    });
    setShowSlotForm(true);
  };

  const handleDeleteSlot = (slotId) => {
    setTimeSlots(timeSlots.filter((slot) => slot.id !== slotId));
    if (selectedSlot?.id === slotId) {
      setSelectedSlot(null);
    }
  };

  const handleSaveSlot = (e) => {
    e.preventDefault();
    if (editingSlotId) {
      // Edit existing slot
      setTimeSlots(
        timeSlots.map((slot) =>
          slot.id === editingSlotId
            ? { ...slot, ...formData }
            : slot
        )
      );
    } else {
      // Add new slot
      const newSlot = {
        id: `SLOT${Date.now()}`,
        ...formData,
        booked: 0,
      };
      setTimeSlots([...timeSlots, newSlot]);
    }
    setShowSlotForm(false);
    setFormData({
      time: "",
      hospital: "",
      location: "",
      department: "",
      capacity: "",
      type: "In-Person",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value) || "" : value,
    }));
  };

  return (
    <div className="dashboard-layout">
      <DoctorSidebar />

      <main className="dashboard-main">
        <div className="topbar">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {doctorProfile.name}. You have {dashboardStats.sessionsToday} sessions today.
            </p>
          </div>

          <button
            className="ms-btn-primary start-session-btn"
            onClick={() => navigate("/doctor/telemedicine")}
          >
            Start Video Session
          </button>
        </div>

        <div className="dashboard-grid">
          <section className="left-column">
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Today's Appointments</h2>
                <button
                  type="button"
                  className="card-link"
                  onClick={() => navigate("/doctor/appointments")}
                >
                  View All Schedule
                </button>
              </div>

              <div className="appointment-list">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`appointment-item ${
                      appointment.status === "join-now" ? "highlight-item" : ""
                    }`}
                  >
                    <div className="appointment-time">{appointment.time}</div>

                    <div className="appointment-content">
                      <h3>{appointment.patientName}</h3>
                      <p>{appointment.reason}</p>
                    </div>

                    <div className="appointment-actions">
                      <span className="appointment-badge">{appointment.type}</span>
                      {appointment.status === "join-now" && (
                        <button className="join-btn">JOIN NOW</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h2>Pending Requests</h2>
              </div>

              <div className="requests-grid">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-top">
                      <div className="small-avatar">👤</div>
                      <div>
                        <h3>{request.patientName}</h3>
                        <p className="request-time">{request.requestTime}</p>
                      </div>
                    </div>

                    <p className="request-note">{request.note}</p>

                    <div className="request-buttons">
                      <button className="ms-btn-primary small-btn">ACCEPT</button>
                      <button className="secondary-btn small-btn">REJECT</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="right-column">
            <div className="dashboard-card mini-card">
              <div className="card-header">
                <h2>Availability</h2>
              </div>

              <div className="month-label">{monthLabel}</div>

              <div className="calendar-grid">
                {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((day) => (
                  <span key={day} className="calendar-day-name">{day}</span>
                ))}
                {calendarDays.map((day, idx) => (
                  <span
                    key={idx}
                    className={`calendar-date ${
                      day.isToday ? "today-date" : ""
                    } ${
                      selectedDate === day.date && day.isCurrentMonth ? "active-date" : ""
                    } ${!day.isCurrentMonth ? "other-month" : ""}`}
                    onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                    style={{ cursor: day.isCurrentMonth ? "pointer" : "default" }}
                  >
                    {day.date}
                  </span>
                ))}
              </div>

              <p className="slot-title">ACTIVE SLOTS - {selectedDate.toString().padStart(2, '0')}</p>
              <div className="slot-list">
                {getAvailableSlotsForDate(selectedDate).map((slot) => (
                  <span
                    key={slot.id}
                    className={`slot-chip ${selectedSlot?.id === slot.id ? "selected-slot" : ""}`}
                    onClick={() => handleSlotClick(slot)}
                    style={{ cursor: "pointer" }}
                  >
                    {slot.time}
                  </span>
                ))}
              </div>

              <button 
                className="ms-btn-primary" 
                onClick={handleAddSlot}
                style={{ marginTop: "10px", width: "100%" }}
              >
                + ADD TIME SLOT
              </button>
            </div>

            <div className="dashboard-card mini-card">
              <h2 className="insight-title">AI ASSISTANT INSIGHT</h2>
              <p className="insight-text">{aiInsight.message}</p>
              <button className="ms-btn-primary optimize-btn">
                OPTIMIZE MY SCHEDULE
              </button>
            </div>

            <div className="stats-row">
              <div className="stat-box">
                <p>Patients Today</p>
                <h3>{dashboardStats.patientsToday}</h3>
              </div>
              <div className="stat-box">
                <p>Wait Time</p>
                <h3>{dashboardStats.waitTime}</h3>
              </div>
            </div>
          </aside>
        </div>

        {/* Hospital Details Panel */}
        {selectedSlot && (
          <div className="hospital-details-panel dashboard-card">
            <div className="card-header">
              <h2>Hospital Details - {selectedSlot.time}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedSlot(null)}
                style={{ cursor: "pointer", fontSize: "20px", border: "none", background: "none" }}
              >
                ✕
              </button>
            </div>

            <div className="details-content" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <p><strong>Hospital:</strong> {selectedSlot.hospital}</p>
                <p><strong>Location:</strong> {selectedSlot.location}</p>
                <p><strong>Department:</strong> {selectedSlot.department}</p>
                <p><strong>Type:</strong> {selectedSlot.type}</p>
              </div>
              <div>
                <p><strong>Total Capacity:</strong> {selectedSlot.capacity}</p>
                <p><strong>Booked:</strong> {selectedSlot.booked}</p>
                <p><strong>Available:</strong> {selectedSlot.capacity - selectedSlot.booked}</p>
                <p style={{ color: selectedSlot.capacity - selectedSlot.booked < 2 ? "red" : "green" }}>
                  <strong>Status:</strong> {selectedSlot.capacity - selectedSlot.booked < 2 ? "Full" : "Available"}
                </p>
              </div>
            </div>

            <div className="button-group" style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                className={`ms-btn-primary action-btn ${activeSlotAction === "edit" ? "active" : ""}`}
                onClick={() => {
                  setActiveSlotAction("edit");
                  handleEditSlot(selectedSlot);
                }}
              >
                EDIT
              </button>
              <button
                className={`secondary-btn action-btn ${activeSlotAction === "delete" ? "active" : ""}`}
                onClick={() => {
                  setActiveSlotAction("delete");
                  handleDeleteSlot(selectedSlot.id);
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        )}

        {/* Time Slot Management Form */}
        {showSlotForm && (
          <div className="time-slot-form dashboard-card" style={{ maxWidth: "500px", margin: "20px auto" }}>
            <div className="card-header">
              <h2>{editingSlotId ? "Edit Time Slot" : "Add New Time Slot"}</h2>
              <button
                className="close-btn"
                onClick={() => setShowSlotForm(false)}
                style={{ cursor: "pointer", fontSize: "20px", border: "none", background: "none" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlot} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label><strong>Time Slot (e.g., 08:00 - 12:00)</strong></label>
                <input
                  type="text"
                  name="time"
                  value={formData.time}
                  onChange={handleFormChange}
                  required
                  placeholder="08:00 - 12:00"
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div>
                <label><strong>Hospital Name</strong></label>
                <input
                  type="text"
                  name="hospital"
                  value={formData.hospital}
                  onChange={handleFormChange}
                  required
                  placeholder="MediSphere Clinic"
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div>
                <label><strong>Location</strong></label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  required
                  placeholder="Downtown, New York"
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div>
                <label><strong>Department</strong></label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  required
                  placeholder="Cardiology"
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div>
                <label><strong>Capacity</strong></label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleFormChange}
                  required
                  placeholder="6"
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div>
                <label><strong>Appointment Type</strong></label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                >
                  <option value="In-Person">In-Person</option>
                  <option value="Video Call">Video Call</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  className="ms-btn-primary"
                  style={{ flex: 1 }}
                >
                  {editingSlotId ? "UPDATE SLOT" : "ADD SLOT"}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowSlotForm(false)}
                  style={{ flex: 1 }}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        <footer className="dashboard-footer">
          <div>
            <h3>Ethereal Clinic</h3>
            <p>© 2024 Ethereal Clinic. All health data is encrypted.</p>
          </div>
          <div className="footer-links">
            <span>Contact</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Twitter</span>
            <span>LinkedIn</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DoctorDashboard;