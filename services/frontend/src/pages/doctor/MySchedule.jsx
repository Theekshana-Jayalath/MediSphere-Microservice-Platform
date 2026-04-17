import { useState, useEffect } from "react";
import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import { getAppointmentsByDoctorId } from "../../services/doctor/appointmentApi.js";
import "../../styles/mySchedule.css";

const safeParseJSON = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractAppointments = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const normalizeStatus = (status) => {
  const value = String(status || "").trim().toLowerCase();

  if (["confirmed", "approved", "accepted"].includes(value)) return "confirmed";
  if (["completed", "done"].includes(value)) return "completed";
  if (["cancelled", "canceled", "rejected"].includes(value)) return "cancelled";
  return "pending";
};

const normalizeAppointmentType = (appointment) => {
  const rawType = String(
    appointment?.appointmentType || appointment?.consultationType || appointment?.type || "In-Person"
  )
    .trim()
    .toLowerCase();

  if (["online", "video", "video call"].includes(rawType)) {
    return "Video Call";
  }

  if (rawType === "physical") {
    return "In-Person";
  }

  return appointment?.appointmentType || appointment?.consultationType || appointment?.type || "In-Person";
};

const buildScheduleRecord = (appointment) => {
  const startTime =
    appointment?.appointmentTime ||
    appointment?.startTime ||
    appointment?.time ||
    "00:00";

  return {
    id: appointment?.appointmentId || appointment?._id || appointment?.id,
    date: appointment?.appointmentDate || appointment?.date || "",
    time: startTime,
    endTime: appointment?.endTime || startTime,
    patientName:
      appointment?.patientName ||
      appointment?.patient?.name ||
      appointment?.patient?.fullName ||
      "Unknown Patient",
    type: normalizeAppointmentType(appointment),
    reason: appointment?.reason || appointment?.consultationReason || "Consultation",
    hospital: appointment?.hospital || "Not specified",
    location:
      normalizeAppointmentType(appointment) === "Video Call"
        ? "Online"
        : appointment?.location || appointment?.hospital || "Not specified",
    status: normalizeStatus(appointment?.status),
  };
};

const MySchedule = () => {
  const [viewMode, setViewMode] = useState("month"); // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [scheduleError, setScheduleError] = useState("");

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchScheduleAppointments = async () => {
      try {
        setIsLoadingAppointments(true);
        setScheduleError("");

        const user = safeParseJSON(localStorage.getItem("user") || "") || {};
        const doctorUserId = user?.id || user?._id || "";

        if (!doctorUserId) {
          if (isMounted) {
            setAppointments([]);
            setScheduleError("Doctor session not found. Please login again.");
          }
          return;
        }

        const response = await getAppointmentsByDoctorId(doctorUserId);
        const fetchedAppointments = extractAppointments(response).map(buildScheduleRecord);

        if (isMounted) {
          setAppointments(fetchedAppointments);
        }
      } catch (error) {
        if (isMounted) {
          setAppointments([]);
          setScheduleError(
            error?.response?.data?.message || "Failed to load schedule appointments."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingAppointments(false);
        }
      }
    };

    fetchScheduleAppointments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, appointments]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: daysInPrevMonth - i,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayAppointments = appointments.filter((apt) => apt.date === dateStr);
      days.push({
        date: i,
        isCurrentMonth: true,
        dateString: dateStr,
        appointmentCount: dayAppointments.length,
        appointments: dayAppointments,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
      });
    }

    setCalendarDays(days);
  };

  const getTodayAppointments = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return appointments.filter((apt) => apt.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getWeekAppointments = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Sunday

    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.date);
        return aptDate >= start && aptDate <= end;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return appointments
      .filter((apt) => apt.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 5);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day);
    }
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "completed":
        return "#2196F3";
      case "cancelled":
        return "#f44336";
      default:
        return "#9E9E9E";
    }
  };

  return (
    <div className="schedule-layout">
      <DoctorSidebar />

      <main className="schedule-main">
        <div className="schedule-header">
          <h1>My Schedule</h1>
          <p>Manage your appointments and availability</p>
        </div>

        {scheduleError && <div className="appointments-error-message">{scheduleError}</div>}
        {isLoadingAppointments && <div className="appointments-empty-state">Loading appointments...</div>}

        <div className="schedule-controls">
          <div className="view-modes">
            <button
              className={`view-btn ${viewMode === "day" ? "active" : ""}`}
              onClick={() => setViewMode("day")}
            >
              📅 Day
            </button>
            <button
              className={`view-btn ${viewMode === "week" ? "active" : ""}`}
              onClick={() => setViewMode("week")}
            >
              📆 Week
            </button>
            <button
              className={`view-btn ${viewMode === "month" ? "active" : ""}`}
              onClick={() => setViewMode("month")}
            >
              📋 Month
            </button>
          </div>

          <div className="date-navigation">
            <button onClick={prevMonth} className="nav-btn">
              ← Prev
            </button>
            <span className="current-month">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button onClick={nextMonth} className="nav-btn">
              Next →
            </button>
          </div>
        </div>

        <div className="schedule-content">
          {/* Left Panel - Calendar */}
          <div className="calendar-section">
            <div className="mini-calendar">
              <div className="calendar-header">
                <h3>{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
              </div>

              <div className="calendar-weekdays">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                  <div key={day} className="weekday-header">
                    {day}
                  </div>
                ))}
              </div>

              <div className="calendar-dates">
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`calendar-date-cell ${
                      !day.isCurrentMonth ? "other-month" : ""
                    } ${selectedDate?.dateString === day.dateString ? "selected" : ""}`}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="date-number">{day.date}</div>
                    {day.appointmentCount > 0 && (
                      <div className="appointment-indicator">
                        {day.appointmentCount > 0 && (
                          <span className="apt-count">{day.appointmentCount}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Appointments Card */}
            <div className="upcoming-card">
              <h3>📌 Next 5 Appointments</h3>
              <div className="upcoming-list">
                {getUpcomingAppointments().length > 0 ? (
                  getUpcomingAppointments().map((apt) => (
                    <div
                      key={apt.id}
                      className="upcoming-item"
                      onClick={() => handleAppointmentClick(apt)}
                      style={{ borderLeft: `4px solid ${getStatusColor(apt.status)}` }}
                    >
                      <div className="upcoming-time">{formatTime(apt.time)}</div>
                      <div className="upcoming-info">
                        <p className="upcoming-patient">{apt.patientName}</p>
                        <p className="upcoming-type">{apt.type}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-appointments">No upcoming appointments</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Schedule View */}
          <div className="schedule-view">
            {viewMode === "month" && (
              <div className="month-view">
                <div className="month-grid">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, idx) => (
                    <div key={day} className="month-day-header">
                      {day.substring(0, 3)}
                    </div>
                  ))}
                  {calendarDays.map((day, idx) => (
                    <div
                      key={idx}
                      className={`month-cell ${!day.isCurrentMonth ? "other-month" : ""} ${
                        selectedDate?.dateString === day.dateString ? "selected-cell" : ""
                      }`}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="cell-date">{day.date}</div>
                      <div className="cell-appointments">
                        {day.appointments?.map((apt) => (
                          <div
                            key={apt.id}
                            className="cell-apt"
                            onClick={() => handleAppointmentClick(apt)}
                            style={{ backgroundColor: getStatusColor(apt.status) }}
                            title={apt.patientName}
                          >
                            {formatTime(apt.time)} {apt.patientName.split(" ")[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === "week" && (
              <div className="week-view">
                <div className="week-header">
                  <div className="time-column"></div>
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const date = new Date(currentDate);
                    date.setDate(date.getDate() - date.getDay() + 1 + idx);
                    return (
                      <div key={idx} className="day-column-header">
                        <div className="day-name">
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className="day-date">{date.getDate()}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="week-body">
                  <div className="times-column">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div key={idx} className="time-slot">
                        {`${8 + idx}:00`}
                      </div>
                    ))}
                  </div>

                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const date = new Date(currentDate);
                    date.setDate(date.getDate() - date.getDay() + 1 + dayIdx);
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                    const dayAppts = appointments.filter((apt) => apt.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));

                    return (
                      <div key={dayIdx} className="day-column">
                        {Array.from({ length: 10 }).map((_, hour) => {
                          const hourStr = `${8 + hour}:00`;
                          const aptAtThisTime = dayAppts.find(
                            (apt) => apt.time.startsWith(String(8 + hour).padStart(2, "0"))
                          );

                          return (
                            <div
                              key={`${dayIdx}-${hour}`}
                              className="hour-slot"
                              onClick={() =>
                                aptAtThisTime && handleAppointmentClick(aptAtThisTime)
                              }
                            >
                              {aptAtThisTime && (
                                <div
                                  className="week-apt"
                                  style={{
                                    backgroundColor: getStatusColor(aptAtThisTime.status),
                                  }}
                                >
                                  <div className="apt-time">
                                    {formatTime(aptAtThisTime.time)}
                                  </div>
                                  <div className="apt-patient">
                                    {aptAtThisTime.patientName.split(" ")[0]}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === "day" && (
              <div className="day-view">
                <div className="day-title">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                <div className="day-timeline">
                  {getTodayAppointments().length > 0 ? (
                    getTodayAppointments().map((apt) => (
                      <div
                        key={apt.id}
                        className="timeline-item"
                        onClick={() => handleAppointmentClick(apt)}
                        style={{ borderLeft: `5px solid ${getStatusColor(apt.status)}` }}
                      >
                        <div className="timeline-time">
                          {formatTime(apt.time)} - {formatTime(apt.endTime)}
                        </div>
                        <div className="timeline-content">
                          <h4>{apt.patientName}</h4>
                          <p className="timeline-type">{apt.type}</p>
                          <p className="timeline-reason">{apt.reason}</p>
                          <div className="timeline-location">
                            <span>📍 {apt.hospital}</span>
                            <span>{apt.location}</span>
                          </div>
                        </div>
                        <div className={`timeline-status ${apt.status}`}>
                          {apt.status.toUpperCase()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-appointments-day">
                      <p>No appointments today</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Appointment Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="label">Patient:</span>
                <span className="value">{selectedAppointment.patientName}</span>
              </div>

              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">
                  {new Date(selectedAppointment.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Time:</span>
                <span className="value">
                  {formatTime(selectedAppointment.time)} -{" "}
                  {formatTime(selectedAppointment.endTime)}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Type:</span>
                <span className="value">{selectedAppointment.type}</span>
              </div>

              <div className="detail-row">
                <span className="label">Reason:</span>
                <span className="value">{selectedAppointment.reason}</span>
              </div>

              <div className="detail-row">
                <span className="label">Hospital:</span>
                <span className="value">{selectedAppointment.hospital}</span>
              </div>

              <div className="detail-row">
                <span className="label">Location:</span>
                <span className="value">{selectedAppointment.location}</span>
              </div>

              <div className="detail-row">
                <span className="label">Status:</span>
                <span
                  className="value status-badge"
                  style={{
                    color: getStatusColor(selectedAppointment.status),
                    fontWeight: "bold",
                  }}
                >
                  {selectedAppointment.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Close
              </button>
              <button className="btn-primary">Reschedule</button>
              <button className="btn-danger">Cancel Appointment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySchedule;
