import { Link, useLocation } from "react-router-dom";
import "../../styles/Doctor/doctorSidebar.css";

const DoctorSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", path: "/doctor/dashboard", icon: "📊" },
    { label: "My Schedule", path: "/doctor/schedule", icon: "🗓️" },
    { label: "Appointment Requests", path: "/doctor/appointments", icon: "📩" },
    { label: "Availability", path: "/doctor/availability", icon: "⏳" },
    { label: "Patient Reports", path: "/doctor/reports", icon: "📁" },
    { label: "Issue Prescription", path: "/doctor/create-prescription", icon: "💊" },
    { label: "View Prescriptions", path: "/doctor/prescriptions", icon: "📝" },
    { label: "Video Consultations", path: "/doctor/telemedicine", icon: "🎥" },
  ];

  return (
    <aside className="doctor-sidebar">
      <div className="brand-box">
        <div className="brand-icon">✚</div>
        <div>
          <h2 className="brand-title">Medisphere</h2>
          <p className="brand-subtitle">Premium Concierge</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${
              location.pathname === item.path ? "active-link" : ""
            }`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="profile-setting">⚙ Profile Settings</p>

        <div className="doctor-mini-card">
          <div className="doctor-avatar">👨‍⚕️</div>
          <div>
            <h4>Dr. Julian Vane</h4>
            <p>Chief Cardiologist</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DoctorSidebar;