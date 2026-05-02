import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../styles/Admin/AdminDoctors.css";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [toast, setToast] = useState(null);

  const API_BASE_URL = "http://localhost:5015/api/admin/doctors";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getAuthToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  const parseResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    return { message: await response.text() };
  };

  const normalizeDoctorStatus = (doctor) => {
    const rawStatus =
      doctor?.approvalStatus ||
      doctor?.approvalstatus ||
      doctor?.status ||
      "";

    const status = String(rawStatus).toLowerCase();

    if (status === "approved") return "Active";
    if (status === "pending_approval") return "Pending";
    if (status === "rejected") return "Rejected";

    return "Unknown";
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);

      const token = getAuthToken();

      const response = await fetch(API_BASE_URL, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch doctors");
      }

      let doctorList = [];

      if (Array.isArray(data)) {
        doctorList = data;
      } else if (Array.isArray(data?.data)) {
        doctorList = data.data;
      } else if (Array.isArray(data?.doctors)) {
        doctorList = data.doctors;
      }

      setDoctors(doctorList);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      showToast(error.message || "Failed to fetch doctors", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const allSpecialties = useMemo(() => {
    const values = doctors
      .map((doctor) => doctor.specialization || doctor.specialty || "")
      .filter(Boolean);

    return ["All Specialties", ...Array.from(new Set(values))];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const fullName = String(
        doctor.fullName || doctor.name || ""
      ).toLowerCase();
      const email = String(doctor.email || "").toLowerCase();
      const specialty = String(
        doctor.specialization || doctor.specialty || ""
      ).toLowerCase();
      const licenseNumber = String(doctor.licenseNumber || "").toLowerCase();
      const status = normalizeDoctorStatus(doctor).toLowerCase();

      const term = searchText.trim().toLowerCase();

      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        email.includes(term) ||
        specialty.includes(term) ||
        licenseNumber.includes(term);

      const matchesSpecialty =
        specialtyFilter === "All Specialties" ||
        (doctor.specialization || doctor.specialty || "") === specialtyFilter;

      const matchesStatus =
        statusFilter === "All Status" ||
        normalizeDoctorStatus(doctor) === statusFilter;

      return matchesSearch && matchesSpecialty && matchesStatus;
    });
  }, [doctors, searchText, specialtyFilter, statusFilter]);

  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter(
    (doctor) => normalizeDoctorStatus(doctor) === "Active"
  ).length;
  const pendingDoctors = doctors.filter(
    (doctor) => normalizeDoctorStatus(doctor) === "Pending"
  ).length;

  const formatStatusClass = (status) => {
    if (status === "Active") return "active";
    if (status === "Pending") return "pending";
    if (status === "Rejected") return "rejected";
    return "unknown";
  };

  const handleDelete = async () => {
    if (!doctorToDelete) return;

    try {
      setDeleting(true);

      const token = getAuthToken();
      const doctorId = doctorToDelete._id || doctorToDelete.id;

      const response = await fetch(`${API_BASE_URL}/${doctorId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete doctor");
      }

      if (
        selectedDoctor &&
        (selectedDoctor._id || selectedDoctor.id) === doctorId
      ) {
        setSelectedDoctor(null);
      }

      setDoctorToDelete(null);
      await fetchDoctors();
      showToast("Doctor deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete doctor:", error);
      showToast(error.message || "Failed to delete doctor", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const rows = filteredDoctors.map((doctor) => ({
      doctorName: doctor.fullName || doctor.name || "",
      email: doctor.email || "",
      specialty: doctor.specialization || doctor.specialty || "",
      licenseNumber: doctor.licenseNumber || "",
      phone: doctor.phone || "",
      baseHospital: doctor.baseHospital || "",
      consultationFee:
        doctor.consultationFee !== undefined ? doctor.consultationFee : "",
      status: normalizeDoctorStatus(doctor),
      createdAt: doctor.createdAt
        ? new Date(doctor.createdAt).toLocaleString()
        : "",
    }));

    const headers = [
      "Doctor Name",
      "Email",
      "Specialty",
      "License Number",
      "Phone",
      "Base Hospital",
      "Consultation Fee",
      "Status",
      "Created At",
    ];

    const escapeCSV = (value) => {
      const stringValue = String(value ?? "");
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.doctorName,
          row.email,
          row.specialty,
          row.licenseNumber,
          row.phone,
          row.baseHospital,
          row.consultationFee,
          row.status,
          row.createdAt,
        ]
          .map(escapeCSV)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];

    link.href = url;
    link.setAttribute("download", `doctors-registry-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-doctors-layout">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <AdminSidebar />

      {toast && (
        <div className={`admin-doctors-toast ${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <p>{toast.message}</p>
        </div>
      )}

      <div className="admin-doctors-main">
        <header className="admin-doctors-topbar">
          <div className="admin-doctors-topbar-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search across registry..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </header>

        <main className="admin-doctors-content">
          <section className="admin-doctors-header-row">
            <div>
              <h1>Doctor Registry</h1>
              <p>
                Manage clinical personnel, verify credentials, and monitor
                professional availability across the network.
              </p>
            </div>
          </section>

          <section className="admin-doctors-stats">
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-icon blue">
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <span className="mini-chip green">Live</span>
              </div>
              <h2>{totalDoctors}</h2>
              <p>Total Registered Doctors</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-icon soft">
                  <span className="material-symbols-outlined">
                    check_circle
                  </span>
                </div>
                <span className="mini-chip">Optimal</span>
              </div>
              <h2>{activeDoctors}</h2>
              <p>Active Doctors</p>
            </div>

            <div className="stat-card highlight">
              <div className="stat-card-top">
                <div className="stat-icon red">
                  <span className="material-symbols-outlined">
                    pending_actions
                  </span>
                </div>
                <span className="mini-chip red">Action Required</span>
              </div>
              <h2>{pendingDoctors}</h2>
              <p>Pending Verifications</p>
            </div>
          </section>

          <section className="admin-doctors-controls">
            <div className="bulk-actions">
              <button type="button">Select All</button>
              <button type="button" onClick={handleExportCSV}>
                Export CSV
              </button>
              <button type="button">Bulk Update</button>
            </div>

            <div className="filter-actions">
              <div className="filter-box">
                <label>Specialty</label>
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                >
                  {allSpecialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-box">
                <label>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                  <option>Unknown</option>
                </select>
              </div>
            </div>
          </section>

          <section className="admin-doctors-table-card">
            <div className="admin-doctors-table-wrap">
              <table className="admin-doctors-table">
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Specialty</th>
                    <th>License Number</th>
                    <th>Status</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="table-message">
                        Loading doctors...
                      </td>
                    </tr>
                  ) : filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="table-message">
                        No doctors found
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doctor) => {
                      const status = normalizeDoctorStatus(doctor);
                      const specialty =
                        doctor.specialization || doctor.specialty || "--";
                      const name = doctor.fullName || doctor.name || "--";
                      const photo =
                        doctor.photo && doctor.photo.trim()
                          ? doctor.photo
                          : "https://i.pravatar.cc/100?img=12";

                      return (
                        <tr key={doctor._id}>
                          <td>
                            <div className="doctor-info-cell">
                              <img src={photo} alt={name} />
                              <div>
                                <p>{name}</p>
                                <small>{doctor.email || "--"}</small>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="specialty-badge">{specialty}</span>
                          </td>

                          <td>{doctor.licenseNumber || "--"}</td>

                          <td>
                            <div
                              className={`status-pill ${formatStatusClass(
                                status
                              )}`}
                            >
                              <span className="dot"></span>
                              <span>{status}</span>
                            </div>
                          </td>

                          <td className="right">
                            <div className="row-actions">
                              <button
                                type="button"
                                className="icon-action"
                                title="View"
                                onClick={() => setSelectedDoctor(doctor)}
                              >
                                <span className="material-symbols-outlined">
                                  visibility
                                </span>
                              </button>

                              <button
                                type="button"
                                className="icon-action delete"
                                title="Delete"
                                onClick={() => setDoctorToDelete(doctor)}
                              >
                                <span className="material-symbols-outlined">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-doctors-table-footer">
              <p>
                Showing {filteredDoctors.length} of {doctors.length} doctors
              </p>

              <div className="pagination">
                <button type="button" disabled>
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </button>
                <button type="button" className="active">
                  1
                </button>
                <button type="button" disabled>
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
          className="doctor-modal-overlay"
          onClick={() => setSelectedDoctor(null)}
        >
          <div className="doctor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-modal-header">
              <h2>Doctor Details</h2>
              <button type="button" onClick={() => setSelectedDoctor(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="doctor-modal-profile">
              <img
                src={
                  selectedDoctor.photo && selectedDoctor.photo.trim()
                    ? selectedDoctor.photo
                    : "https://i.pravatar.cc/100?img=12"
                }
                alt={selectedDoctor.fullName || selectedDoctor.name}
              />
              <div>
                <h3>{selectedDoctor.fullName || selectedDoctor.name || "--"}</h3>
                <p>{selectedDoctor.email || "--"}</p>
              </div>
            </div>

            <div className="doctor-modal-grid">
              <div>
                <strong>Phone</strong>
                <span>{selectedDoctor.phone || "--"}</span>
              </div>

              <div>
                <strong>Specialization</strong>
                <span>{selectedDoctor.specialization || "--"}</span>
              </div>

              <div>
                <strong>License Number</strong>
                <span>{selectedDoctor.licenseNumber || "--"}</span>
              </div>

              <div>
                <strong>Experience Years</strong>
                <span>{selectedDoctor.experienceYears ?? "--"}</span>
              </div>

              <div>
                <strong>Base Hospital</strong>
                <span>{selectedDoctor.baseHospital || "--"}</span>
              </div>

              <div>
                <strong>Consultation Fee</strong>
                <span>
                  {selectedDoctor.consultationFee !== undefined
                    ? selectedDoctor.consultationFee
                    : "--"}
                </span>
              </div>

              <div>
                <strong>Status</strong>
                <span>{normalizeDoctorStatus(selectedDoctor)}</span>
              </div>

              <div>
                <strong>Created At</strong>
                <span>
                  {selectedDoctor.createdAt
                    ? new Date(selectedDoctor.createdAt).toLocaleString()
                    : "--"}
                </span>
              </div>
            </div>

            <div className="doctor-modal-block">
              <strong>Channeling Hospitals</strong>
              <div className="chip-list">
                {Array.isArray(selectedDoctor.channelingHospitals) &&
                selectedDoctor.channelingHospitals.length > 0 ? (
                  selectedDoctor.channelingHospitals.map((hospital, index) => (
                    <span key={index} className="small-chip">
                      {hospital}
                    </span>
                  ))
                ) : (
                  <span>--</span>
                )}
              </div>
            </div>

            <div className="doctor-modal-block">
              <strong>Availability Schedules</strong>
              <div className="schedule-list">
                {Array.isArray(selectedDoctor.availabilitySchedules) &&
                selectedDoctor.availabilitySchedules.length > 0 ? (
                  selectedDoctor.availabilitySchedules.map((slot, index) => (
                    <div key={index} className="schedule-item">
                      <span>{slot.day || "--"}</span>
                      <span>
                        {slot.startTime || "--"} - {slot.endTime || "--"}
                      </span>
                    </div>
                  ))
                ) : (
                  <span>--</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {doctorToDelete && (
        <div
          className="doctor-modal-overlay"
          onClick={() => {
            if (!deleting) setDoctorToDelete(null);
          }}
        >
          <div
            className="doctor-modal delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon">
              <span className="material-symbols-outlined">warning</span>
            </div>

            <h2>Delete Doctor</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{doctorToDelete.fullName || doctorToDelete.name}</strong>?
            </p>
            <p className="delete-subtext">This action cannot be undone.</p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="cancel-delete-btn"
                onClick={() => setDoctorToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-btn"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-doctors-toast {
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
          animation: adminDoctorsToastSlideIn 0.25s ease;
        }

        .admin-doctors-toast.success {
          border-left: 5px solid #16a34a;
        }

        .admin-doctors-toast.error {
          border-left: 5px solid #dc2626;
        }

        .admin-doctors-toast span {
          font-size: 24px;
        }

        .admin-doctors-toast.success span {
          color: #16a34a;
        }

        .admin-doctors-toast.error span {
          color: #dc2626;
        }

        .admin-doctors-toast p {
          margin: 0;
          color: #1D2D44;
          font-size: 14px;
          font-weight: 600;
        }

        @keyframes adminDoctorsToastSlideIn {
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