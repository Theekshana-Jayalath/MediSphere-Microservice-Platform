import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/Doctor/doctorSidebar.css";

const DoctorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    user = null;
  }
  const rawDoctorName = user?.name || user?.fullName || "Doctor";
  const doctorName = /^dr\.?\s/i.test(rawDoctorName)
    ? rawDoctorName
    : `Dr. ${rawDoctorName}`;
  const doctorRole = user?.specialization || user?.role || "Doctor";
  const [doctorIdentifier, setDoctorIdentifier] = useState(
    user?.doctorId || "ID pending"
  );

  useEffect(() => {
    const doctorUserId = user?.id || user?._id;

    if (user?.doctorId || !doctorUserId) {
      return;
    }

    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    const baseUrls = [
      import.meta.env.VITE_DOCTOR_API_BASE_URL,
      "http://localhost:6010/api/doctors",
    ].filter(Boolean);

    const fetchDoctorId = async () => {
      for (const baseUrl of baseUrls) {
        try {
          const response = await fetch(`${baseUrl}/${doctorUserId}`, {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          });

          if (!response.ok) {
            continue;
          }

          const payload = await response.json();
          const fetchedDoctorId = payload?.data?.doctorId;

          if (fetchedDoctorId) {
            setDoctorIdentifier(fetchedDoctorId);
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...user,
                doctorId: fetchedDoctorId,
              })
            );
          }

          break;
        } catch (error) {
          continue;
        }
      }
    };

    fetchDoctorId();
  }, [user]);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

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
            <h4>{doctorName}</h4>
            <p>{doctorRole}</p>
            <p className="doctor-id-badge">{doctorIdentifier}</p>
          </div>
        </div>

        <button
          type="button"
          className="doctor-logout-btn"
          onClick={handleLogout}
        >
          <span className="sidebar-icon">↪</span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default DoctorSidebar;