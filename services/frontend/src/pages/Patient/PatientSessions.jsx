import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/Patient/PatientSidebar";
import PatientSessionCard from "../../components/Patient/PatientSessionCard";
import { getAllSessions } from "../../services/patientTelemedicineApi";
import "../../styles/Patient/patientSessions.css";

const PatientSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState("");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    user = null;
  }

  const storedPatientProfile = localStorage.getItem("patientProfile");
  const patientProfile = storedPatientProfile ? JSON.parse(storedPatientProfile) : null;

  const patientName = patientProfile?.name || patientProfile?.fullName || user?.name || "Patient";
  const patientId = patientProfile?.patientId || user?.patientId || user?._id || user?.id || "";

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("patientProfile");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const fetchPatientSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const sessionsRes = await getAllSessions();

      const allSessions = Array.isArray(sessionsRes?.sessions)
        ? sessionsRes.sessions
        : Array.isArray(sessionsRes?.data?.sessions)
        ? sessionsRes.data.sessions
        : Array.isArray(sessionsRes)
        ? sessionsRes
        : [];

      // Debug raw sessions to help diagnose mismatches
      // eslint-disable-next-line no-console
      console.debug("telemedicine: fetched sessions", allSessions);

      // Build a list of possible patient id values to match against session.patientId
      const idsToMatch = [
        patientProfile?.patientId,
        patientProfile?._id,
        user?.patientId,
        user?._id,
        user?.id,
      ]
        .filter(Boolean)
        .map((v) => String(v));

      const patientSessions = allSessions.filter((session) => {
        const sessPid = String(session?.patientId || "");
        return idsToMatch.includes(sessPid);
      });

      setSessions(patientSessions);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    if (activeFilter === "all") return sessions;
    return sessions.filter(
      (session) => (session?.status || "").toLowerCase() === activeFilter
    );
  }, [sessions, activeFilter]);

  return (
    <div className="patient-sessions-page">
      <PatientSidebar
        patientName={patientName}
        patientId={patientId}
        activeItem="sessions"
        onLogout={handleLogout}
      />

      <main className="patient-sessions-main">
        <div className="patient-sessions-header">
          <div>
            <h1 className="patient-sessions-title">My Telemedicine Sessions</h1>
            <p className="patient-sessions-subtitle">
              View your confirmed video consultation sessions and join using the session link.
            </p>
          </div>

          <button
            type="button"
            className="patient-sessions-refresh-btn"
            onClick={fetchPatientSessions}
          >
            Refresh
          </button>
        </div>

        {error && <div className="patient-sessions-error">{error}</div>}

        <section className="patient-sessions-summary-grid">
          <div className="patient-sessions-summary-card">
            <span>Total Sessions</span>
            <strong>{sessions.length}</strong>
          </div>
          <div className="patient-sessions-summary-card">
            <span>Scheduled</span>
            <strong>{sessions.filter((s) => s.status === "scheduled").length}</strong>
          </div>
          <div className="patient-sessions-summary-card">
            <span>Started</span>
            <strong>{sessions.filter((s) => s.status === "started").length}</strong>
          </div>
          <div className="patient-sessions-summary-card">
            <span>Completed</span>
            <strong>{sessions.filter((s) => s.status === "completed").length}</strong>
          </div>
        </section>

        <section className="patient-sessions-filter-row">
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
          <div className="patient-sessions-empty-box">Loading sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="patient-sessions-empty-box">
            No sessions found for this patient.
          </div>
        ) : (
          <section className="patient-sessions-card-grid">
            {filteredSessions.map((session) => (
              <PatientSessionCard key={session._id} session={session} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default PatientSessions;