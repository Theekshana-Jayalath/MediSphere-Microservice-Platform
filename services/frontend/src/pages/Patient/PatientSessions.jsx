import { useEffect, useMemo, useState } from "react";
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

  const patientId = user?.patientId || user?._id || user?.id || "";

  const fetchPatientSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const sessionsRes = await getAllSessions();

      const allSessions = Array.isArray(sessionsRes?.sessions)
        ? sessionsRes.sessions
        : [];

      const patientSessions = allSessions.filter(
        (session) => String(session?.patientId) === String(patientId)
      );

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
    </div>
  );
};

export default PatientSessions;