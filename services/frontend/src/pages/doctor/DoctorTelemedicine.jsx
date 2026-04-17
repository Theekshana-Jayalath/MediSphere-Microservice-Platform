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
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DoctorTelemedicine = () => {
  const navigate = useNavigate();

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
  const [query, setQuery] = useState("");

  const getLoggedInUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  };

  const user = getLoggedInUser();

  const doctorId = String(
    user?.doctorId || user?._id || user?.id || ""
  ).trim();

  const normalizeId = (value) => String(value || "").trim();

  const buildDoctorSummary = (doctorSessions) => ({
    total: doctorSessions.length,
    scheduled: doctorSessions.filter((s) => s.status === "scheduled").length,
    started: doctorSessions.filter((s) => s.status === "started").length,
    completed: doctorSessions.filter((s) => s.status === "completed").length,
    cancelled: doctorSessions.filter((s) => s.status === "cancelled").length,
  });

  const fetchDoctorSessions = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!doctorId) {
        setSessions([]);
        setSummary({
          total: 0,
          scheduled: 0,
          started: 0,
          completed: 0,
          cancelled: 0,
        });
        setError("Doctor ID not found in localStorage user object.");
        return;
      }

      const [sessionsRes, summaryRes] = await Promise.all([
        getAllSessions(),
        getSessionSummary(),
      ]);

      const allSessions = Array.isArray(sessionsRes?.sessions)
        ? sessionsRes.sessions
        : Array.isArray(sessionsRes?.data?.sessions)
        ? sessionsRes.data.sessions
        : Array.isArray(sessionsRes)
        ? sessionsRes
        : [];

      console.log("Logged in user:", user);
      console.log("Doctor ID used for filtering:", doctorId);
      console.log("All sessions from API:", allSessions);
      console.log("Session summary response:", summaryRes);
      console.log("Logged in user:", user);

      console.log("First session doctorId:", allSessions?.[0]?.doctorId);

      const doctorSessions = allSessions;

      console.log("Filtered doctor sessions:", doctorSessions);

      setSessions(doctorSessions);
      setSummary(buildDoctorSummary(doctorSessions));
    } catch (err) {
      console.error("Failed to load telemedicine sessions:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load telemedicine sessions."
      );
      setSessions([]);
      setSummary({
        total: 0,
        scheduled: 0,
        started: 0,
        completed: 0,
        cancelled: 0,
      });
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
      console.error("Failed to start session:", err);
      setError(
        err?.response?.data?.message || err?.message || "Failed to start session."
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

      const response = await completeSession(sessionId);
      const completedSession = response?.session || response?.data?.session;

      setMessage("Session marked as completed successfully.");

      if (completedSession?._id) {
        navigate(`/doctor/create-prescription?sessionId=${completedSession._id}`);
        return;
      }

      await fetchDoctorSessions();
    } catch (err) {
      console.error("Failed to complete session:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to complete session."
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

  const searchedSessions = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return filteredSessions;
    return filteredSessions.filter((s) => {
      const appt = String(s?.appointmentId || "").toLowerCase();
      const doctor = String(s?.doctorName || "").toLowerCase();
      const patient = String(s?.patientName || "").toLowerCase();
      const status = String(s?.status || "").toLowerCase();
      return (
        appt.includes(q) ||
        doctor.includes(q) ||
        patient.includes(q) ||
        status.includes(q)
      );
    });
  }, [filteredSessions, query]);

  const downloadPdf = () => {
    if (!searchedSessions || searchedSessions.length === 0) {
      alert("No sessions to export.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const title = "Telemedicine Sessions Report";
    const generatedAt = new Date().toLocaleString();

    doc.setFontSize(14);
    doc.text(title, 40, 48);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${generatedAt} — Showing ${searchedSessions.length} session(s)`, 40, 66);

    const columns = [
      { header: "Appointment ID", dataKey: "appointmentId" },
      { header: "Doctor", dataKey: "doctorName" },
      { header: "Patient", dataKey: "patientName" },
      { header: "Scheduled", dataKey: "scheduledTime" },
      { header: "Status", dataKey: "status" },
    ];

    const rows = searchedSessions.map((s) => ({
      appointmentId: s.appointmentId || s._id || "",
      doctorName: s.doctorName || "",
      patientName: s.patientName || "",
      scheduledTime: s.scheduledTime ? new Date(s.scheduledTime).toLocaleString() : "",
      status: s.status || "",
    }));

    autoTable(doc, {
      startY: 80,
      head: [columns.map((c) => c.header)],
      body: rows.map((r) => columns.map((c) => String(r[c.dataKey] || ""))),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [243, 246, 251], textColor: 20, halign: "left" },
      columnStyles: { 0: { cellWidth: 110 } },
      theme: "striped",
    });

    const fileName = `telemedicine-sessions-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="doctor-telemedicine-layout">
      <DoctorSidebar />

      <main className="doctor-telemedicine-main">
        <div className="doctor-telemedicine-topbar">
          <div>
            <h1 className="doctor-telemedicine-title">Telemedicine Sessions</h1>
            <p className="doctor-telemedicine-subtitle">
              View your scheduled consultations, start video sessions, and mark
              them as completed.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="search"
              placeholder="Search by appointment, doctor, patient or status"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e6eef9" }}
            />

            <button
              type="button"
              className="doctor-telemedicine-refresh-btn"
              onClick={fetchDoctorSessions}
            >
              Refresh
            </button>

            <button
              type="button"
              className="doctor-telemedicine-refresh-btn"
              onClick={downloadPdf}
              title="Download sessions (PDF)"
            >
              Download Report (PDF)
            </button>
          </div>
        </div>

        {message && <div className="doctor-telemedicine-message">{message}</div>}
        {error && <div className="doctor-telemedicine-error">{error}</div>}

        <section className="doctor-telemedicine-summary-grid">
          <div className="doctor-telemedicine-summary-card">
            <span>Total Sessions</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="doctor-telemedicine-summary-card">
            <span>Scheduled</span>
            <strong>{summary.scheduled}</strong>
          </div>
          <div className="doctor-telemedicine-summary-card">
            <span>Started</span>
            <strong>{summary.started}</strong>
          </div>
          <div className="doctor-telemedicine-summary-card">
            <span>Completed</span>
            <strong>{summary.completed}</strong>
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
        ) : searchedSessions.length === 0 ? (
          <div className="doctor-telemedicine-empty-box">
            No sessions found for this doctor.
          </div>
        ) : (
          <section className="doctor-telemedicine-card-grid">
            {searchedSessions.map((session) => (
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