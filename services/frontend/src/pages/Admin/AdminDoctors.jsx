import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../styles/Admin/AdminDoctors.css";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const API_BASE_URL = "http://localhost:5015/api/admin/doctors";

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
      alert(error.message || "Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDelete = async (doctor) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${doctor.fullName || doctor.name}?`
    );

    if (!confirmed) return;

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/${doctor._id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete doctor");
      }

      if (selectedDoctor?._id === doctor._id) {
        setSelectedDoctor(null);
      }

      await fetchDoctors();
      alert("Doctor deleted successfully");
    } catch (error) {
      console.error("Failed to delete doctor:", error);
      alert(error.message || "Failed to delete doctor");
    }
  };

  const allSpecialties = useMemo(() => {
    const values = doctors
      .map((doctor) => doctor.specialization || doctor.specialty || "")
      .filter(Boolean);

    return ["All Specialties", ...Array.from(new Set(values))];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const fullName = String(doctor.fullName || doctor.name || "").toLowerCase();
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

          <div className="admin-doctors-topbar-right">
            <button type="button" className="icon-btn">
              <span className="material-symbols-outlined">notifications</span>
            </button>

            <button type="button" className="icon-btn">
              <span className="material-symbols-outlined">help_outline</span>
            </button>

            <div className="admin-doctors-admin-box">
              <div>
                <p>Administrator</p>
                <span>Super Admin Access</span>
              </div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyRJECO7XNaOKiPBQBG2eQDdoZoG1Ax3xshkjcmVaodppBrLbBTUIYk4dLy_CHMIvdcElWe9szj_8L1kLWuXaa60Ma49_LE8AJVOXO4cuUFepda0XjqhywbHnjV_iGhKEDQOn_OVRGV-ZuShra994kCQBTZLyjFXUPw2wODxe_3xxsdhtB36NyYH34abE_Q0T5ASOSwIdOBBFqR0graU20moohXnzDh-QXB44KRxHN-2KzM7HXvBy6Bx9HMgVGth0q9oXCk9groAM"
                alt="Administrator"
              />
            </div>
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

            <div className="admin-doctors-header-actions">
              <button type="button" className="secondary-btn">
                <span className="material-symbols-outlined">filter_list</span>
                <span>Advanced Filters</span>
              </button>

              <button type="button" className="primary-btn">
                <span className="material-symbols-outlined">person_add</span>
                <span>Add New Doctor</span>
              </button>
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
              <button type="button">Export CSV</button>
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
                            <div className={`status-pill ${formatStatusClass(status)}`}>
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
                                onClick={() => handleDelete(doctor)}
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
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button type="button" className="active">
                  1
                </button>
                <button type="button" disabled>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {selectedDoctor && (
        <div className="doctor-modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div
            className="doctor-modal"
            onClick={(e) => e.stopPropagation()}
          >
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
    </div>
  );
}