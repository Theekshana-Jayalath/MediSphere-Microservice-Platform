import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../styles/Admin/AdminVerifyAccounts.css";

export default function AdminVerifyAccounts() {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [verifiedDoctors, setVerifiedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties");
  const [statusFilter, setStatusFilter] = useState("Status: Pending");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [stats, setStats] = useState({
    pendingCount: 0,
    verifiedThisMonth: 0,
    averageReviewTime: 0,
  });

  const API_BASE_URL = "http://localhost:5015/api/admin/doctors";

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  const parseResponseData = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();
    return {
      message: text || "Unexpected server response",
    };
  };

  const getDoctorId = (doctor) => doctor?._id || doctor?.id;
  const getDoctorName = (doctor) =>
    doctor?.fullName || doctor?.name || "Unknown Doctor";
  const getDoctorEmail = (doctor) => doctor?.email || "No email";
  const getDoctorSpecialty = (doctor) =>
    doctor?.specialization || doctor?.specialty || "General";
  const getDoctorLicenseNumber = (doctor) =>
    doctor?.licenseNumber || doctor?.medicalLicenseNumber || "N/A";
  const getDoctorStatus = (doctor) =>
    doctor?.approvalStatus || doctor?.status || "pending_approval";

  const getDoctorImage = (doctor) => {
    if (doctor?.photo && doctor.photo.trim() !== "") {
      return doctor.photo;
    }
    return "https://via.placeholder.com/80x80.png?text=DR";
  };

  const formatDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Calculate average review time from verified doctors
  const calculateAverageReviewTime = (verifiedDoctorsList) => {
    if (!verifiedDoctorsList || verifiedDoctorsList.length === 0) return 0;
    
    let totalHours = 0;
    let validReviews = 0;
    
    verifiedDoctorsList.forEach(doctor => {
      const createdAt = doctor?.createdAt ? new Date(doctor.createdAt) : null;
      const updatedAt = doctor?.updatedAt ? new Date(doctor.updatedAt) : null;
      
      if (createdAt && updatedAt && updatedAt > createdAt) {
        const diffInMs = updatedAt - createdAt;
        const diffInHours = diffInMs / (1000 * 60 * 60);
        totalHours += diffInHours;
        validReviews++;
      }
    });
    
    if (validReviews === 0) return 0;
    const avgHours = totalHours / validReviews;
    return Math.round(avgHours * 10) / 10; // Round to 1 decimal place
  };

  // Calculate verified count for current month
  const calculateVerifiedThisMonth = (verifiedDoctorsList) => {
    if (!verifiedDoctorsList || verifiedDoctorsList.length === 0) return 0;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return verifiedDoctorsList.filter(doctor => {
      const approvedDate = doctor?.updatedAt ? new Date(doctor.updatedAt) : null;
      if (!approvedDate) return false;
      
      return approvedDate.getMonth() === currentMonth && 
             approvedDate.getFullYear() === currentYear;
    }).length;
  };

  // Fetch verified doctors to calculate stats
  const fetchVerifiedDoctors = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/verified`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await parseResponseData(response);
        const verifiedList = Array.isArray(data)
          ? data
          : Array.isArray(data?.doctors)
          ? data.doctors
          : Array.isArray(data?.data)
          ? data.data
          : [];
        
        setVerifiedDoctors(verifiedList);
        
        const verifiedThisMonth = calculateVerifiedThisMonth(verifiedList);
        const averageReviewTime = calculateAverageReviewTime(verifiedList);
        
        setStats(prev => ({
          ...prev,
          verifiedThisMonth,
          averageReviewTime
        }));
      }
    } catch (error) {
      console.error("Failed to fetch verified doctors:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);

      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/pending`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await parseResponseData(response);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch doctors");
      }

      const doctorList = Array.isArray(data)
        ? data
        : Array.isArray(data?.doctors)
        ? data.doctors
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setDoctors(doctorList);
      
      const pendingCount = doctorList.filter(
        (doctor) => String(getDoctorStatus(doctor)).toLowerCase() === "pending_approval"
      ).length;
      
      setStats(prev => ({ ...prev, pendingCount }));
      
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      alert(error.message || "Failed to load doctor applications");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchVerifiedDoctors();
  }, []);

  const specialtyOptions = useMemo(() => {
    const values = doctors
      .map((doctor) => getDoctorSpecialty(doctor))
      .filter(Boolean);

    return ["All Specialties", ...new Set(values)];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const specialty = getDoctorSpecialty(doctor);
      const status = String(getDoctorStatus(doctor)).toLowerCase();

      const matchesSpecialty =
        specialtyFilter === "All Specialties" || specialty === specialtyFilter;

      const matchesStatus =
        statusFilter === "Status: Pending"
          ? status === "pending_approval"
          : statusFilter === "Status: Under Review"
          ? status === "under_review"
          : statusFilter === "Status: Escalated"
          ? status === "escalated"
          : true;

      return matchesSpecialty && matchesStatus;
    });
  }, [doctors, specialtyFilter, statusFilter]);

  const handleAccept = async (doctor) => {
    try {
      const doctorId = getDoctorId(doctor);
      if (!doctorId) {
        alert("Doctor id not found");
        return;
      }

      setActionLoadingId(doctorId);

      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/${doctorId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      const data = await parseResponseData(response);

      if (!response.ok) {
        throw new Error(
          data?.message || `Failed to approve ${getDoctorName(doctor)}`
        );
      }

      alert(`Accepted ${getDoctorName(doctor)}`);
      if (selectedDoctor && getDoctorId(selectedDoctor) === doctorId) {
        setSelectedDoctor(null);
      }
      await fetchDoctors();
      await fetchVerifiedDoctors();
    } catch (error) {
      console.error("Approve doctor failed:", error);
      alert(error.message || "Failed to approve doctor");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (doctor) => {
    try {
      const doctorId = getDoctorId(doctor);
      if (!doctorId) {
        alert("Doctor id not found");
        return;
      }

      const reason = window.prompt(
        `Enter rejection reason for ${getDoctorName(doctor)}:`,
        ""
      );

      if (reason === null) return;

      setActionLoadingId(doctorId);

      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/${doctorId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rejectionReason: reason,
        }),
      });

      const data = await parseResponseData(response);

      if (!response.ok) {
        throw new Error(
          data?.message || `Failed to reject ${getDoctorName(doctor)}`
        );
      }

      alert(`Declined ${getDoctorName(doctor)}`);
      if (selectedDoctor && getDoctorId(selectedDoctor) === doctorId) {
        setSelectedDoctor(null);
      }
      await fetchDoctors();
    } catch (error) {
      console.error("Reject doctor failed:", error);
      alert(error.message || "Failed to reject doctor");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleView = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleCloseModal = () => {
    setSelectedDoctor(null);
  };

  const formatReviewTime = (hours) => {
    if (hours === 0) return "N/A";
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    return `${hours}h`;
  };

  return (
    <div className="admin-verify-layout">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <AdminSidebar />

      <div className="admin-verify-main">
        <header className="admin-verify-topbar">
          <div className="admin-verify-search">
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Search applications..." />
          </div>
        </header>

        <main className="admin-verify-content">
          <div className="admin-verify-header">
            <h1>Doctor Verification</h1>
            <p>
              Review and manage clinical credentials for incoming medical
              professionals.
            </p>
          </div>

          <section className="verify-stats-grid">
            <div className="verify-stat-card">
              <div className="verify-stat-top">
                <div className="verify-stat-icon light">
                  <span className="material-symbols-outlined">
                    pending_actions
                  </span>
                </div>
                <span className="verify-chip">Live data</span>
              </div>
              <h2>{stats.pendingCount}</h2>
              <p>Total Pending Verifications</p>
            </div>

            <div className="verify-stat-card">
              <div className="verify-stat-top">
                <div className="verify-stat-icon soft">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <span className="verify-chip">System data</span>
              </div>
              <h2>{stats.verifiedThisMonth}</h2>
              <p>Verified this Month</p>
            </div>

            <div className="verify-stat-card">
              <div className="verify-stat-top">
                <div className="verify-stat-icon blue">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <span className="verify-chip">Estimated</span>
              </div>
              <h2>{formatReviewTime(stats.averageReviewTime)}</h2>
              <p>Average Review Time</p>
            </div>
          </section>

          <section className="verify-table-card">
            <div className="verify-table-controls">
              <div className="verify-filters">
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                >
                  {specialtyOptions.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>Status: Pending</option>
                  <option>Status: Under Review</option>
                  <option>Status: Escalated</option>
                </select>
              </div>

              <div className="verify-table-actions">
                <button type="button">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button type="button">
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
            </div>

            <div className="verify-table-wrap">
              <table className="verify-table">
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Specialty</th>
                    <th>License Number</th>
                    <th>Application Date</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", padding: "24px" }}
                      >
                        Loading doctor applications...
                      </td>
                    </tr>
                  ) : filteredDoctors.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", padding: "24px" }}
                      >
                        No doctor applications found
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <tr key={getDoctorId(doctor)}>
                        <td>
                          <div className="doctor-cell">
                            <img
                              src={getDoctorImage(doctor)}
                              alt={getDoctorName(doctor)}
                            />
                            <div>
                              <p className="doctor-name">
                                {getDoctorName(doctor)}
                              </p>
                              <p className="doctor-email">
                                {getDoctorEmail(doctor)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="specialty-pill">
                            {getDoctorSpecialty(doctor)}
                          </span>
                        </td>

                        <td>{getDoctorLicenseNumber(doctor)}</td>

                        <td>
                          <p>{formatDate(doctor?.createdAt)}</p>
                          <small>{formatTime(doctor?.createdAt)}</small>
                        </td>

                        <td className="right">
                          <div className="doctor-actions">
                            <button
                              type="button"
                              className="view-btn"
                              onClick={() => handleView(doctor)}
                              disabled={actionLoadingId === getDoctorId(doctor)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="accept-btn"
                              onClick={() => handleAccept(doctor)}
                              disabled={actionLoadingId === getDoctorId(doctor)}
                            >
                              {actionLoadingId === getDoctorId(doctor)
                                ? "Please wait..."
                                : "Accept"}
                            </button>
                            <button
                              type="button"
                              className="decline-btn"
                              onClick={() => handleDecline(doctor)}
                              disabled={actionLoadingId === getDoctorId(doctor)}
                            >
                              {actionLoadingId === getDoctorId(doctor)
                                ? "Please wait..."
                                : "Decline"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="verify-table-footer">
              <p>
                Showing {filteredDoctors.length} of {doctors.length} pending
                applications
              </p>

              <div className="verify-pagination">
                <button type="button" disabled>
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </button>
                <button type="button" className="active">
                  1
                </button>
                <button type="button">2</button>
                <button type="button">3</button>
                <button type="button">
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {selectedDoctor && (
        <div
          onClick={handleCloseModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "720px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, color: "#1D2D44" }}>Doctor Details</h2>

              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#1D2D44",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <img
                src={getDoctorImage(selectedDoctor)}
                alt={getDoctorName(selectedDoctor)}
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <div>
                <h3 style={{ margin: "0 0 6px 0", color: "#1D2D44" }}>
                  {getDoctorName(selectedDoctor)}
                </h3>
                <p style={{ margin: 0, color: "#6b7280" }}>
                  {getDoctorEmail(selectedDoctor)}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Full Name
                </strong>
                <span>{getDoctorName(selectedDoctor)}</span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Email
                </strong>
                <span>{getDoctorEmail(selectedDoctor)}</span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Phone
                </strong>
                <span>{selectedDoctor?.phone || "N/A"}</span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Specialty
                </strong>
                <span>{getDoctorSpecialty(selectedDoctor)}</span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  License Number
                </strong>
                <span>{getDoctorLicenseNumber(selectedDoctor)}</span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Experience Years
                </strong>
                <span>{selectedDoctor?.experienceYears ?? "N/A"}</span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Base Hospital
                </strong>
                <span>{selectedDoctor?.baseHospital || "N/A"}</span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Consultation Fee
                </strong>
                <span>
                  {selectedDoctor?.consultationFee !== undefined &&
                  selectedDoctor?.consultationFee !== null
                    ? `LKR ${selectedDoctor.consultationFee}`
                    : "N/A"}
                </span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Application Date
                </strong>
                <span>{formatDate(selectedDoctor?.createdAt)}</span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Application Time
                </strong>
                <span>{formatTime(selectedDoctor?.createdAt)}</span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Approval Status
                </strong>
                <span>{getDoctorStatus(selectedDoctor)}</span>
              </div>

              <div
                style={{
                  background: "#f8f5f2",
                  padding: "16px",
                  borderRadius: "14px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px" }}>
                  Role
                </strong>
                <span>{selectedDoctor?.role || "doctor"}</span>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                background: "#f8f5f2",
                padding: "16px",
                borderRadius: "14px",
              }}
            >
              <strong style={{ display: "block", marginBottom: "6px" }}>
                Channeling Hospitals
              </strong>
              <span>
                {Array.isArray(selectedDoctor?.channelingHospitals) &&
                selectedDoctor.channelingHospitals.length > 0
                  ? selectedDoctor.channelingHospitals.join(", ")
                  : "N/A"}
              </span>
            </div>

            <div
              style={{
                marginTop: "24px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => handleDecline(selectedDoctor)}
                style={{
                  border: "1px solid #dc2626",
                  background: "transparent",
                  color: "#dc2626",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Decline
              </button>

              <button
                type="button"
                onClick={() => handleAccept(selectedDoctor)}
                style={{
                  border: "none",
                  background: "#1D2D44",
                  color: "#ffffff",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}