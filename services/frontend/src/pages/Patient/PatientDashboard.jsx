import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/Patient/PatientSidebar";
import "../../styles/Patient/PatientDashboard.css";

export default function PatientDashboard() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [patientProfile, setPatientProfile] = useState(() => {
    const storedPatientProfile = localStorage.getItem("patientProfile");
    return storedPatientProfile ? JSON.parse(storedPatientProfile) : null;
  });

  const patientName =
    patientProfile?.name || patientProfile?.fullName || user?.name || "Patient";
  const patientEmail = patientProfile?.email || user?.email || "No email";
  const patientId = patientProfile?.patientId || user?.patientId || "------";

  const [vitals, setVitals] = useState({
    heartRate: "72",
    bloodPressure: "118/75",
    glucose: "94",
  });

  // State for custom toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const savedVitals = localStorage.getItem("patientVitals");
    if (savedVitals) {
      setVitals(JSON.parse(savedVitals));
    }
  }, []);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;
        if (patientProfile?.patientId) return;

        const response = await fetch("http://localhost:5015/api/patients/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(data?.message || "Failed to fetch patient profile");
          return;
        }

        setPatientProfile(data);
        localStorage.setItem("patientProfile", JSON.stringify(data));
      } catch (error) {
        console.error("Failed to fetch patient profile:", error);
      }
    };

    fetchPatientProfile();
  }, [patientProfile?.patientId]);

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setVitals((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveVitals = () => {
    localStorage.setItem("patientVitals", JSON.stringify(vitals));
    showToast("Vitals saved successfully", "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("patientProfile");
    localStorage.removeItem("patientVitals");
    navigate("/login");
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const age = calculateAge(patientProfile?.dateOfBirth);

  const getHeartRateStatus = (value, patientAge) => {
    const hr = Number(value);
    if (!hr) return "Check";

    let low = 60;
    let high = 100;
    let criticalLow = 40;
    let criticalHigh = 130;

    if (patientAge !== null) {
      if (patientAge < 1) {
        low = 100;
        high = 160;
        criticalLow = 70;
        criticalHigh = 190;
      } else if (patientAge <= 3) {
        low = 90;
        high = 150;
        criticalLow = 70;
        criticalHigh = 180;
      } else if (patientAge <= 5) {
        low = 80;
        high = 140;
        criticalLow = 60;
        criticalHigh = 170;
      } else if (patientAge <= 12) {
        low = 70;
        high = 120;
        criticalLow = 50;
        criticalHigh = 150;
      } else {
        low = 60;
        high = 100;
        criticalLow = 40;
        criticalHigh = 130;
      }
    }

    if (hr <= criticalLow || hr >= criticalHigh) return "Critical";
    if (hr < low) return "Low";
    if (hr > high) return "High";
    return "Normal";
  };

  const getBloodPressureStatus = (value) => {
    const parts = value.split("/");
    const systolic = Number(parts[0]);
    const diastolic = Number(parts[1]);

    if (!systolic || !diastolic) return "Check";

    if (systolic < 90 || diastolic < 60) return "Low";
    if (systolic < 120 && diastolic < 80) return "Optimal";
    if (systolic >= 180 || diastolic >= 120) return "Critical";
    if (systolic >= 120 || diastolic >= 80) return "High";

    return "Check";
  };

  const getGlucoseStatus = (value) => {
    const glucose = Number(value);
    if (!glucose) return "Check";

    if (glucose < 70) return "Low";
    if (glucose < 100) return "Normal";
    if (glucose >= 250) return "Critical";
    if (glucose >= 100) return "High";

    return "Check";
  };

  const heartRateStatus = useMemo(
    () => getHeartRateStatus(vitals.heartRate, age),
    [vitals.heartRate, age]
  );

  const bloodPressureStatus = useMemo(
    () => getBloodPressureStatus(vitals.bloodPressure),
    [vitals.bloodPressure]
  );

  const glucoseStatus = useMemo(
    () => getGlucoseStatus(vitals.glucose),
    [vitals.glucose]
  );

  const getStatusClass = (status) => {
    if (status === "Normal" || status === "Optimal") return "green";
    if (status === "Low") return "blue";
    if (status === "High") return "amber";
    if (status === "Critical") return "red";
    return "amber";
  };

  return (
    <div className="patient-dashboard-page">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <PatientSidebar
        patientName={patientName}
        patientId={patientId}
        activeItem="dashboard"
        onLogout={handleLogout}
      />

      {/* Custom Toast Notification */}
      {toast && (
        <div className={`dashboard-toast ${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <p>{toast.message}</p>
        </div>
      )}

      <main className="patient-main">
        <header className="patient-topbar">
          <div className="patient-search-wrap">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search records, doctors, or health tips..."
            />
          </div>

          <div className="patient-topbar-right">
            <button className="patient-notification-btn">
              <span className="material-symbols-outlined">notifications</span>
              <span className="patient-notification-dot"></span>
            </button>

            <div
              className="patient-user-box"
              onClick={() => navigate("/patient/profile")}
              style={{ cursor: "pointer" }}
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrN1LqW-RHmFFNnzzLRJ7P6x0ftJXxcbutPSdcT4NSDdd-JsFNhpz1lczyA_SdmmLQAYJHFDBpRNrfbaB5GdldP2carSUNQ_h8-OqHXyZpC7K1nYi-qhcqbD-GQNMrOwwIEMjnJBl05VTjLVFEafQwmKaPyTNwIcUbWnfrjDnrqG1RLo1zXLDvAbibBvRr-s38ws1atQOvuYZWvzOCEzle4TjBAfYooLOqzy8AdZ5JCG5uAlXzKNnbzVln4WxnXNpRbJhqj-LpgBo"
                alt="patient"
              />
              <div className="patient-user-details">
                <span>{patientName}</span>
                <small>{patientEmail}</small>
              </div>
            </div>
          </div>
        </header>

        <div className="patient-content">
          <section className="patient-vitals-section">
            <div className="patient-vitals-header">
              <div className="patient-vitals-title">
                <span className="material-symbols-outlined">add_circle</span>
                <h2>Update Daily Vitals</h2>
              </div>
              <p>Last updated: 2 hours ago</p>
            </div>

            <div className="patient-vitals-grid">
              <div className="vital-input-card">
                <div className="vital-label-row">
                  <label>Heart Rate</label>
                  <span className={`status ${getStatusClass(heartRateStatus)}`}>
                    {heartRateStatus.toUpperCase()}
                  </span>
                </div>
                <div className="vital-input-wrap">
                  <input
                    type="number"
                    name="heartRate"
                    value={vitals.heartRate}
                    onChange={handleVitalChange}
                    placeholder="72"
                  />
                  <span>bpm</span>
                </div>
              </div>

              <div className="vital-input-card">
                <div className="vital-label-row">
                  <label>Blood Pressure</label>
                  <span
                    className={`status ${getStatusClass(bloodPressureStatus)}`}
                  >
                    {bloodPressureStatus.toUpperCase()}
                  </span>
                </div>
                <div className="vital-input-wrap">
                  <input
                    type="text"
                    name="bloodPressure"
                    value={vitals.bloodPressure}
                    onChange={handleVitalChange}
                    placeholder="118/75"
                  />
                  <span>mmHg</span>
                </div>
              </div>

              <div className="vital-input-card">
                <div className="vital-label-row">
                  <label>Glucose</label>
                  <span className={`status ${getStatusClass(glucoseStatus)}`}>
                    {glucoseStatus.toUpperCase()}
                  </span>
                </div>
                <div className="vital-input-wrap">
                  <input
                    type="number"
                    name="glucose"
                    value={vitals.glucose}
                    onChange={handleVitalChange}
                    placeholder="94"
                  />
                  <span>mg/dL</span>
                </div>
              </div>
            </div>

            <div className="patient-vitals-action">
              <button onClick={handleSaveVitals}>
                <span className="material-symbols-outlined">save</span>
                Save Vitals
              </button>
            </div>
          </section>

          <section className="patient-metrics-row">
            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-icon red material-symbols-outlined">
                  favorite
                </span>
                <span className={`status ${getStatusClass(heartRateStatus)}`}>
                  {heartRateStatus.toUpperCase()}
                </span>
              </div>
              <p>Heart Rate</p>
              <h3>
                {vitals.heartRate} <span>bpm</span>
              </h3>
              <div className="metric-bar">
                <div className="metric-fill"></div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-icon blue material-symbols-outlined">
                  speed
                </span>
                <span
                  className={`status ${getStatusClass(bloodPressureStatus)}`}
                >
                  {bloodPressureStatus.toUpperCase()}
                </span>
              </div>
              <p>Blood Pressure</p>
              <h3>
                {vitals.bloodPressure} <span>mmHg</span>
              </h3>
              <div className="metric-bar">
                <div className="metric-fill two"></div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-icon amber material-symbols-outlined">
                  water_drop
                </span>
                <span className={`status ${getStatusClass(glucoseStatus)}`}>
                  {glucoseStatus.toUpperCase()}
                </span>
              </div>
              <p>Glucose</p>
              <h3>
                {vitals.glucose} <span>mg/dL</span>
              </h3>
              <div className="metric-bar">
                <div className="metric-fill three"></div>
              </div>
            </div>

            <div className="book-card">
              <div className="book-icon">
                <span className="material-symbols-outlined">add</span>
              </div>
              <h4>Need care soon?</h4>
              <p>Average wait time: 15 mins</p>
              <button onClick={() => navigate("/appointment")}>
                Book New Appointment
              </button>
            </div>
          </section>
        </div>
      </main>

      <style>{`
        .dashboard-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 20000;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 280px;
          max-width: 420px;
          padding: 14px 18px;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.18);
          animation: dashboardToastSlideIn 0.25s ease;
        }

        .dashboard-toast.success {
          border-left: 5px solid #16a34a;
        }

        .dashboard-toast.error {
          border-left: 5px solid #dc2626;
        }

        .dashboard-toast span {
          font-size: 24px;
        }

        .dashboard-toast.success span {
          color: #16a34a;
        }

        .dashboard-toast.error span {
          color: #dc2626;
        }

        .dashboard-toast p {
          margin: 0;
          color: #07182e;
          font-size: 14px;
          font-weight: 600;
        }

        @keyframes dashboardToastSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}