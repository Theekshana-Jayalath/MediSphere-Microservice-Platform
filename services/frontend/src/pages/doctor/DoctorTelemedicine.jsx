import { useEffect, useMemo, useState } from "react";
import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import SessionCard from "../../components/doctor/SessionCard";
import {
  getAllSessions,
  getSessionSummary,
  startSession,
  completeSession,
} from "../../services/doctor/telemedicineApi";
import "../../styles/Doctor/doctorTelemedicine.css";

const DoctorTelemedicine = () => {
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    scheduled: 0,
    started: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    user = null;
  }

  const doctorId =
    user?.doctorId || user?._id || user?.id || "";

  const fetchDoctorSessions = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [sessionsRes, summaryRes] = await Promise.all([
        getAllSessions(),
        getSessionSummary(),
      ]);

      const allSessions = Array.isArray(sessionsRes?.sessions)
        ? sessionsRes.sessions
        : [];

      const doctorSessions = allSessions.filter(
        (session) => String(session?.doctorId) === String(doctorId)
      );

      setSessions(doctorSessions);
      setSummary(summaryRes?.summary || {
        total: doctorSessions.length,
        scheduled: doctorSessions.filter((s) => s.status === "scheduled").length,
        started: doctorSessions.filter((s) => s.status === "started").length,
        completed: doctorSessions.filter((s) => s.status === "completed").length,
        cancelled: doctorSessions.filter((s) => s.status === "cancelled").length,
      });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Failed to load telemedicine sessions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorSessions();
  }, []);

  const handleStartSession = async (sessionId) => {
    try {
      setUpdatingId(sessionId);
      setMessage("");
      setError("");

      await startSession(sessionId);
      setMessage("Session started successfully.");
      await fetchDoctorSessions();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Failed to start session."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      setUpdatingId(sessionId);
      setMessage("");
      setError("");

      await completeSession(sessionId);
      setMessage("Session marked as completed successfully.");
      await fetchDoctorSessions();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Failed to complete session."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const filteredSessions = useMemo(() => {
    if (activeFilter === "all") return sessions;
    return sessions.filter(
      (session) => (session?.status || "").toLowerCase() === activeFilter
    );
  }, [sessions, activeFilter]);

  return (
    <div className="doctor-telemedicine-layout">
      <DoctorSidebar />

      <main className="doctor-telemedicine-main">
        <div className="doctor-telemedicine-topbar">
          <div>
            <h1 className="doctor-telemedicine-title">Telemedicine Sessions</h1>
            <p className="doctor-telemedicine-subtitle">
              View your scheduled consultations, start video sessions, and mark them as completed.
            </p>
          </div>

          <button
            type="button"
            className="doctor-telemedicine-refresh-btn"
            onClick={fetchDoctorSessions}
          >
            Refresh
          </button>
        </div>

        {message && <div className="doctor-telemedicine-message">{message}</div>}
        {error && <div className="doctor-telemedicine-error">{error}</div>}

        <section className="doctor-telemedicine-summary-grid">
          <div className="doctor-telemedicine-summary-card">
            <span>Total Sessions</span>
            <strong>{sessions.length}</strong>
          </div>
          <div className="doctor-telemedicine-summary-card">
            <span>Scheduled</span>
            <strong>{sessions.filter((s) => s.status === "scheduled").length}</strong>
          </div>
          <div className="doctor-telemedicine-summary-card">
            <span>Started</span>
            <strong>{sessions.filter((s) => s.status === "started").length}</strong>
          </div>
          <div className="doctor-telemedicine-summary-card">
            <span>Completed</span>
            <strong>{sessions.filter((s) => s.status === "completed").length}</strong>
          </div>
        </section>

        <section className="doctor-telemedicine-filter-row">
          <button
            className={activeFilter === "all" ? "active" : ""}
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>
          <button
            className={activeFilter === "scheduled" ? "active" : ""}
            onClick={() => setActiveFilter("scheduled")}
          >
            Scheduled
          </button>
          <button
            className={activeFilter === "started" ? "active" : ""}
            onClick={() => setActiveFilter("started")}
          >
            Started
          </button>
          <button
            className={activeFilter === "completed" ? "active" : ""}
            onClick={() => setActiveFilter("completed")}
          >
            Completed
          </button>
        </section>

        {loading ? (
          <div className="doctor-telemedicine-empty-box">Loading sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="doctor-telemedicine-empty-box">
            No sessions found for this doctor.
          </div>
        ) : (
          <section className="doctor-telemedicine-card-grid">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                onStart={handleStartSession}
                onComplete={handleCompleteSession}
                isUpdating={updatingId === session._id}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default DoctorTelemedicine;