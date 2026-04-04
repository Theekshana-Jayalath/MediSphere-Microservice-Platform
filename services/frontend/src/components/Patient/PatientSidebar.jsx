import React from "react";
import { useNavigate } from "react-router-dom";

export default function PatientSidebar({
  patientName,
  patientId,
  activeItem = "",
  onLogout,
}) {
  const navigate = useNavigate();

  return (
    <aside className="patient-sidebar">
      <div className="sidebar-brand">
        <div className="brand-top">
          <span className="material-symbols-outlined">shield_person</span>
          <h1>{patientName || "Patient"}</h1>
        </div>
        <p>Patient ID: #{patientId}</p>
      </div>

      <nav className="sidebar-nav">
        <a
          href="/patient/dashboard"
          className={`nav-item ${activeItem === "dashboard" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("/patient/dashboard");
          }}
        >
          <span className="material-symbols-outlined">grid_view</span>
          <span>Dashboard</span>
        </a>

        <a href="#" className="nav-item">
          <span className="material-symbols-outlined">calendar_today</span>
          <span>Appointments</span>
        </a>

        <a href="#" className="nav-item">
          <span className="material-symbols-outlined">description</span>
          <span>Medical Reports</span>
        </a>

        <a href="#" className="nav-item">
          <span className="material-symbols-outlined">medical_services</span>
          <span>Prescriptions</span>
        </a>

        <a href="#" className="nav-item">
          <span className="material-symbols-outlined">history</span>
          <span>Medical History</span>
        </a>

        <a href="#" className="nav-item">
          <span className="material-symbols-outlined">videocam</span>
          <span>Video Consultations</span>
        </a>

        <a href="#" className="nav-item">
          <span className="material-symbols-outlined">payments</span>
          <span>Payments</span>
        </a>

        <a href="#" className="nav-item">
          <span className="material-symbols-outlined">notifications</span>
          <span>Notifications</span>
        </a>
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          className="nav-item logout-btn"
          onClick={onLogout}
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Log Out</span>
        </button>

        <a href="#" className="nav-item">
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </a>
      </div>
    </aside>
  );
}