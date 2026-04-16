import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Admin/AdminSidebar.css";

const menuItems = [
  { label: "Dashboard", icon: "grid_view", path: "/admin/dashboard" },
  { label: "Patients", icon: "groups", path: "/admin/patients" },
  { label: "Doctors", icon: "medical_services", path: "/admin/doctors" },
  { label: "Verify Accounts", icon: "verified_user", path: "/admin/verify" },
  { label: "Appointments", icon: "calendar_today", path: "/admin/appointments" },
  { label: "Payments", icon: "payments", path: "/admin/payments" },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-brand-icon">
          <span className="material-symbols-outlined">business_center</span>
        </div>
        <div>
          <h2>MEDISPHERE</h2>
          <p>CLINICAL SYSTEMS</p>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`admin-sidebar-link ${
              location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button className="admin-sidebar-link" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}