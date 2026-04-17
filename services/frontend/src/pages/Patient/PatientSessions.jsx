import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientSessionCard from "../../components/Patient/PatientSessionCard";
import { getAllSessions } from "../../services/patientTelemedicineApi";
import "../../styles/Patient/patientSessions.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PatientSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const navigate = useNavigate();

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

    // Prepare table columns and rows (meeting link intentionally omitted for privacy)
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
    <div className="patient-sessions-page">
      <div className="patient-sessions-header">
        <div>
          <h1 className="patient-sessions-title">My Telemedicine Sessions</h1>
          <p className="patient-sessions-subtitle">
            View your confirmed video consultation sessions and join using the session link.
          </p>
        </div>

        <div className="patient-sessions-actions">
          <input
            type="search"
            placeholder="Search by appointment, doctor, patient or status"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="patient-sessions-search"
          />

          <button
            type="button"
            className="patient-sessions-refresh-btn"
            onClick={fetchPatientSessions}
          >
            Refresh
          </button>

          <button
            type="button"
            className="patient-sessions-download-btn"
            onClick={downloadPdf}
          >
            Download Report (PDF)
          </button>

          <button
            type="button"
            className="patient-sessions-back-btn"
            onClick={() => navigate("/patient/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
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
      ) : searchedSessions.length === 0 ? (
        <div className="patient-sessions-empty-box">
          No sessions found{query ? ` for "${query}"` : " for this patient."}
        </div>
      ) : (
        <section className="patient-sessions-card-grid">
          {searchedSessions.map((session) => (
            <PatientSessionCard key={session._id} session={session} />
          ))}
        </section>
      )}
    </div>
  );
};

export default PatientSessions;