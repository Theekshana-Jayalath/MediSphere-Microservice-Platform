import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import { getDoctorById } from "../../services/doctor/doctorService.js";
import { getAllAppointments, getAppointmentsByDoctorId } from "../../services/doctor/appointmentApi.js";
import { getMyReports } from "../../services/doctor/reportApi.js";
import { getAllPrescriptions, getPrescriptionsByDoctor } from "../../services/doctor/prescriptionApi.js";
import "../../styles/Doctor/doctorDashboard.css";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const safeParseJSON = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const formatDoctorName = (user) => {
  const rawName = user?.name || user?.fullName || user?.email || "Doctor";
  return /^dr\.?\s/i.test(rawName) ? rawName : `Dr. ${rawName}`;
};

const getDoctorInitials = (name) => {
  if (!name) return "DR";

  return name
    .replace(/^dr\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DR";
};

const getAppointmentDateValue = (appointment) => {
  return (
    appointment?.appointmentDate ||
    appointment?.date ||
    appointment?.scheduledDate ||
    appointment?.createdAt ||
    ""
  );
};

const getAppointmentType = (appointment) => {
  const rawType = (appointment?.appointmentType || appointment?.type || "In-Person")
    .toString()
    .trim()
    .toLowerCase();

  if (rawType === "online" || rawType === "video call" || rawType === "video") {
    return "Video Call";
  }

  if (rawType === "physical") {
    return "In-Person";
  }

  return appointment?.appointmentType || appointment?.type || "In-Person";
};

const getAppointmentTime = (appointment) => {
  return (
    appointment?.appointmentTime ||
    appointment?.startTime ||
    appointment?.time ||
    "--:--"
  );
};

const getPatientName = (appointment) => {
  return (
    appointment?.patientName ||
    appointment?.patient?.name ||
    appointment?.patient?.fullName ||
    "Unknown patient"
  );
};

const getAppointmentReason = (appointment) => {
  return appointment?.reason || appointment?.consultationReason || "Consultation";
};

const getStatusLabel = (appointment) => {
  const status = (appointment?.status || "pending").toString().trim().toLowerCase();

  if (["confirmed", "accepted", "approved"].includes(status)) return "Confirmed";
  if (["completed", "done"].includes(status)) return "Completed";
  if (["cancelled", "canceled", "rejected"].includes(status)) return "Cancelled";
  return "Pending";
};

const toArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.reports)) {
    return response.reports;
  }

  if (Array.isArray(response?.prescriptions)) {
    return response.prescriptions;
  }

  return [];
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());

  const storedUser = useMemo(() => {
    return safeParseJSON(localStorage.getItem("user") || "") || {};
  }, []);

  const doctorId = storedUser?.id || storedUser?._id || "";
  const doctorName = useMemo(() => formatDoctorName(storedUser), [storedUser]);
  const doctorDisplayPhoto = doctorProfile?.photo || storedUser?.photo || "";
  const doctorInitials = useMemo(() => getDoctorInitials(doctorName), [doctorName]);

  const calendarMatrix = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const today = new Date();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const monthLabel = calendarDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const days = [];

    for (let index = firstDayIndex - 1; index >= 0; index -= 1) {
      days.push({
        date: daysInPrevMonth - index,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday:
          day === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear(),
      });
    }

    while (days.length < 42) {
      days.push({
        date: days.length - (firstDayIndex + daysInMonth) + 1,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return { monthLabel, days };
  }, [calendarDate]);

  const availableSlots = useMemo(() => {
    const schedules = Array.isArray(doctorProfile?.availabilitySchedules)
      ? doctorProfile.availabilitySchedules
      : [];

    return schedules.map((slot, index) => ({
      id: slot?._id || `${index}-${slot?.date || slot?.day || slot?.startTime || "slot"}`,
      date: slot?.date || "",
      day: slot?.day || "",
      time: [slot?.startTime, slot?.endTime].filter(Boolean).join(" - ") || "Not set",
      hospital: slot?.channelingHospital || doctorProfile?.channelingHospitals?.[0] || "Not specified",
      type: slot?.type || "In-Person",
      status: slot?.isAvailable === false ? "Unavailable" : "Available",
    }));
  }, [doctorProfile]);

  const totalAppointments = appointments.length;
  const videoConsultations = useMemo(() => {
    return appointments.filter((appointment) => getAppointmentType(appointment) === "Video Call");
  }, [appointments]);

  const confirmedAppointments = useMemo(() => {
    return appointments.filter((appointment) => getStatusLabel(appointment) === "Confirmed");
  }, [appointments]);

  const pendingAppointments = useMemo(() => {
    return appointments.filter((appointment) => getStatusLabel(appointment) === "Pending");
  }, [appointments]);

  const todayAppointments = useMemo(() => {
    const todayKey = new Date().toLocaleDateString("en-CA");

    return appointments.filter((appointment) => {
      const rawDate = getAppointmentDateValue(appointment);
      if (!rawDate) return true;

      const parsedDate = new Date(rawDate);
      if (Number.isNaN(parsedDate.getTime())) return true;

      return parsedDate.toLocaleDateString("en-CA") === todayKey;
    });
  }, [appointments]);

  const quickStats = useMemo(() => {
    return [
      {
        label: "Availability Overview",
        value: availableSlots.length,
        detail: `${availableSlots.filter((slot) => slot.status === "Available").length} active slots`,
        tone: "violet",
      },
      {
        label: "Total Reports",
        value: reports.length,
        detail: "Clinical uploads and diagnostics",
        tone: "teal",
      },
      {
        label: "Video Consultations",
        value: videoConsultations.length,
        detail: "Telemedicine appointments",
        tone: "gold",
      },
      {
        label: "Total Prescriptions",
        value: prescriptions.length,
        detail: "Issued treatment records",
        tone: "rose",
      },
      {
        label: "Total Appointments",
        value: totalAppointments,
        detail: `${confirmedAppointments.length} confirmed • ${pendingAppointments.length} pending`,
        tone: "blue",
      },
      {
        label: "Video Consultation Summary",
        value: videoConsultations.length,
        detail: `${todayAppointments.filter((appointment) => getAppointmentType(appointment) === "Video Call").length} scheduled today`,
        tone: "emerald",
      },
    ];
  }, [availableSlots.length, confirmedAppointments.length, pendingAppointments.length, prescriptions.length, reports.length, totalAppointments, todayAppointments, videoConsultations.length]);

  const recentAppointments = useMemo(() => {
    return [...appointments]
      .sort((left, right) => new Date(getAppointmentDateValue(right) || 0) - new Date(getAppointmentDateValue(left) || 0))
      .slice(0, 4);
  }, [appointments]);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const doctorRequests = doctorId ? getDoctorById(doctorId) : Promise.resolve(null);
        const appointmentsRequest = doctorId
          ? getAppointmentsByDoctorId(doctorId)
          : getAllAppointments();
        const reportsRequest = getMyReports();
        const prescriptionsRequest = doctorId
          ? getPrescriptionsByDoctor(doctorId)
          : getAllPrescriptions();

        const [doctorResult, appointmentsResult, reportsResult, prescriptionsResult] =
          await Promise.allSettled([
            doctorRequests,
            appointmentsRequest,
            reportsRequest,
            prescriptionsRequest,
          ]);

        if (!isMounted) return;

        const doctorData =
          doctorResult.status === "fulfilled"
            ? doctorResult.value?.data || doctorResult.value || null
            : null;

        const appointmentData =
          appointmentsResult.status === "fulfilled"
            ? toArray(appointmentsResult.value)
            : [];

        const reportData =
          reportsResult.status === "fulfilled"
            ? toArray(reportsResult.value)
            : [];

        const prescriptionData =
          prescriptionsResult.status === "fulfilled"
            ? toArray(prescriptionsResult.value)
            : [];

        setDoctorProfile(doctorData);
        setAppointments(Array.isArray(appointmentData) ? appointmentData : appointmentData?.data || []);
        setReports(Array.isArray(reportData) ? reportData : reportData?.data || []);
        setPrescriptions(Array.isArray(prescriptionData) ? prescriptionData : prescriptionData?.data || []);

        const errors = [doctorResult, appointmentsResult, reportsResult, prescriptionsResult]
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason?.message || "Failed to load dashboard data");

        if (errors.length > 0 && (!appointments.length || !reports.length || !prescriptions.length)) {
          setError("Some dashboard services are unavailable. Showing what we could load.");
        }
      } catch (dashboardError) {
        if (!isMounted) return;
        setError(dashboardError.message || "Failed to load doctor dashboard.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  return (
    <div className="doctor-dashboard-shell">
      <DoctorSidebar />

      <main className="doctor-dashboard-main">
        <section className="doctor-dashboard-hero">
          <div className="doctor-dashboard-hero-copy">
            <span className="doctor-dashboard-eyebrow">Doctor Command Center</span>
            <h1>Welcome back, {doctorName}</h1>
            <p>
              A single view of your availability, appointments, telemedicine work, reports, and prescriptions.
            </p>

            <div className="doctor-dashboard-hero-actions">
              <button type="button" className="doctor-dashboard-primary-btn" onClick={() => navigate("/doctor/telemedicine")}>Start Video Session</button>
              <button type="button" className="doctor-dashboard-secondary-btn" onClick={() => navigate("/doctor/availability")}>Manage Availability</button>
            </div>
          </div>

          <div className="doctor-dashboard-hero-card">
            <div className="doctor-dashboard-photo-frame">
              {doctorDisplayPhoto ? (
                <img
                  src={doctorDisplayPhoto}
                  alt={doctorName}
                  className="doctor-dashboard-photo"
                />
              ) : (
                <div className="doctor-dashboard-photo-placeholder">
                  <span>{doctorInitials}</span>
                </div>
              )}

              <div className="doctor-dashboard-photo-copy">
                <span>Doctor Profile</span>
                <strong>{doctorName}</strong>
                <p>{doctorProfile?.specialization || storedUser?.specialization || "Specialization not set"}</p>
              </div>
            </div>

            <div className="doctor-dashboard-hero-stack">
              <div>
                <span>Specialization</span>
                <strong>{doctorProfile?.specialization || storedUser?.specialization || "Doctor"}</strong>
              </div>
              <div>
                <span>Base Hospital</span>
                <strong>{doctorProfile?.baseHospital || storedUser?.baseHospital || "Not set"}</strong>
              </div>
              <div>
                <span>Channeling Hospitals</span>
                <strong>{availableSlots.length > 0 ? availableSlots[0].hospital : "No slots yet"}</strong>
              </div>
            </div>
          </div>
        </section>

        {error && <div className="doctor-dashboard-alert error">{error}</div>}

        <section className="doctor-dashboard-stats-grid">
          {quickStats.map((item) => (
            <article key={item.label} className={`doctor-dashboard-stat-card tone-${item.tone}`}>
              <span className="doctor-dashboard-stat-label">{item.label}</span>
              <strong className="doctor-dashboard-stat-value">{isLoading ? "--" : item.value}</strong>
              <p className="doctor-dashboard-stat-detail">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="doctor-dashboard-content-grid">
          <div className="doctor-dashboard-panel doctor-dashboard-panel-large">
            <div className="doctor-dashboard-panel-header">
              <div>
                <span className="doctor-dashboard-panel-kicker">Schedule</span>
                <h2>Today's Appointments</h2>
              </div>
              <button type="button" className="doctor-dashboard-link-btn" onClick={() => navigate("/doctor/appointments")}>View all appointments</button>
            </div>

            {isLoading ? (
              <div className="doctor-dashboard-empty">Loading appointments...</div>
            ) : recentAppointments.length > 0 ? (
              <div className="doctor-dashboard-appointment-list">
                {recentAppointments.map((appointment) => (
                  <article key={appointment._id || appointment.id || `${getPatientName(appointment)}-${getAppointmentTime(appointment)}`} className={`doctor-dashboard-appointment ${getAppointmentType(appointment) === "Video Call" ? "is-highlighted" : ""}`}>
                    <div className="doctor-dashboard-time-pill">
                      <span>{getAppointmentTime(appointment)}</span>
                    </div>

                    <div className="doctor-dashboard-appointment-body">
                      <div className="doctor-dashboard-appointment-row">
                        <h3>{getPatientName(appointment)}</h3>
                        <span className={`doctor-dashboard-type-badge type-${getAppointmentType(appointment).toLowerCase().replace(/\s+/g, "-")}`}>
                          {getAppointmentType(appointment)}
                        </span>
                      </div>
                      <p>{getAppointmentReason(appointment)}</p>
                    </div>

                    <div className="doctor-dashboard-appointment-meta">
                      <span className={`doctor-dashboard-status-badge status-${getStatusLabel(appointment).toLowerCase()}`}>{getStatusLabel(appointment)}</span>
                      <button type="button" className="doctor-dashboard-mini-btn" onClick={() => navigate("/doctor/appointments")}>Open</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="doctor-dashboard-empty">No appointments found for this doctor.</div>
            )}
          </div>

          <aside className="doctor-dashboard-side-stack">
            <div className="doctor-dashboard-panel doctor-dashboard-calendar-panel">
              <div className="doctor-dashboard-panel-header">
                <div>
                  <span className="doctor-dashboard-panel-kicker">Availability Overview</span>
                  <h2>{calendarMatrix.monthLabel}</h2>
                </div>
                <button type="button" className="doctor-dashboard-link-btn" onClick={() => navigate("/doctor/availability")}>Edit slots</button>
              </div>

              <div className="doctor-dashboard-calendar-grid">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="doctor-dashboard-calendar-label">{label}</span>
                ))}
                {calendarMatrix.days.map((day, index) => (
                  <span
                    key={`${day.date}-${index}`}
                    className={`doctor-dashboard-calendar-day ${day.isToday ? "is-today" : ""} ${!day.isCurrentMonth ? "is-muted" : ""}`}
                  >
                    {day.date}
                  </span>
                ))}
              </div>

              <div className="doctor-dashboard-slot-summary">
                <div>
                  <span>Total Slots</span>
                  <strong>{availableSlots.length}</strong>
                </div>
                <div>
                  <span>Available</span>
                  <strong>{availableSlots.filter((slot) => slot.status === "Available").length}</strong>
                </div>
                <div>
                  <span>Unavailable</span>
                  <strong>{availableSlots.filter((slot) => slot.status !== "Available").length}</strong>
                </div>
              </div>

              <div className="doctor-dashboard-slot-chips">
                {availableSlots.length > 0 ? (
                  availableSlots.slice(0, 3).map((slot) => (
                    <article key={slot.id} className="doctor-dashboard-slot-chip">
                      <strong>{slot.time}</strong>
                      <span>{slot.hospital}</span>
                      <p>{slot.date || slot.day || slot.type}</p>
                    </article>
                  ))
                ) : (
                  <div className="doctor-dashboard-empty compact">No availability slots yet.</div>
                )}
              </div>
            </div>

            <div className="doctor-dashboard-panel doctor-dashboard-insight-panel">
              <div className="doctor-dashboard-panel-header">
                <div>
                  <span className="doctor-dashboard-panel-kicker">Clinical Summary</span>
                  <h2>Video Consultation Snapshot</h2>
                </div>
              </div>

              <div className="doctor-dashboard-insight-metric">
                <strong>{videoConsultations.length}</strong>
                <span>Video consultations</span>
              </div>

              <div className="doctor-dashboard-summary-list">
                <div>
                  <span>Confirmed appointments</span>
                  <strong>{confirmedAppointments.length}</strong>
                </div>
                <div>
                  <span>Pending appointments</span>
                  <strong>{pendingAppointments.length}</strong>
                </div>
                <div>
                  <span>Reports uploaded</span>
                  <strong>{reports.length}</strong>
                </div>
                <div>
                  <span>Prescriptions issued</span>
                  <strong>{prescriptions.length}</strong>
                </div>
              </div>

              <button type="button" className="doctor-dashboard-primary-btn full-width" onClick={() => navigate("/doctor/prescriptions")}>
                Review Prescriptions
              </button>
            </div>
          </aside>
        </section>

        <section className="doctor-dashboard-quick-actions">
          <button type="button" className="doctor-dashboard-quick-action" onClick={() => navigate("/doctor/availability")}>
            <span>Availability</span>
            <strong>{availableSlots.length} slots</strong>
          </button>
          <button type="button" className="doctor-dashboard-quick-action" onClick={() => navigate("/doctor/appointments")}>
            <span>Appointments</span>
            <strong>{totalAppointments} total</strong>
          </button>
          <button type="button" className="doctor-dashboard-quick-action" onClick={() => navigate("/doctor/reports")}>
            <span>Reports</span>
            <strong>{reports.length} total</strong>
          </button>
          <button type="button" className="doctor-dashboard-quick-action" onClick={() => navigate("/doctor/prescriptions")}>
            <span>Prescriptions</span>
            <strong>{prescriptions.length} total</strong>
          </button>
        </section>
      </main>
    </div>
  );
};

export default DoctorDashboard;
