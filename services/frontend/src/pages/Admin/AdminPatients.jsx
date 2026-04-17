import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../styles/Admin/AdminPatients.css";

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:5015/api/admin/patients", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to fetch patients");
          setPatients([]);
          return;
        }

        const patientList = Array.isArray(data)
          ? data
          : Array.isArray(data?.patients)
          ? data.patients
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setPatients(patientList);
      } catch (err) {
        console.error("Fetch patients error:", err);
        setError("Something went wrong while loading patients");
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const getPatientName = (patient) => patient?.name || "Unknown Patient";
  const getPatientEmail = (patient) => patient?.email || "-";
  const getPatientId = (patient) =>
    patient?.patientId || patient?._id || patient?.userId || "-";
  const getPatientGender = (patient) => patient?.gender || "Unknown";
  const getPatientPhone = (patient) => patient?.phone || "-";
  const getPatientBloodGroup = (patient) => patient?.bloodGroup || "N/A";
  const getPatientDate = (patient) =>
    patient?.createdAt || patient?.updatedAt || null;

  const getPatientAge = (patient) => {
    const dob = patient?.dateOfBirth;
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
      age -= 1;
    }

    return age;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getInitials = (name) => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "NA";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const genderOptions = useMemo(() => {
    const values = patients
      .map((patient) => getPatientGender(patient))
      .filter(Boolean);
    return ["All", ...new Set(values)];
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const name = getPatientName(patient).toLowerCase();
      const email = String(getPatientEmail(patient)).toLowerCase();
      const phone = String(getPatientPhone(patient)).toLowerCase();
      const gender = getPatientGender(patient);
      const bloodGroup = getPatientBloodGroup(patient);
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        String(bloodGroup).toLowerCase().includes(search);

      const matchesGender = genderFilter === "All" || gender === genderFilter;

      const matchesStatus =
        statusFilter === "All" ||
        String(bloodGroup).toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesGender && matchesStatus;
    });
  }, [patients, searchTerm, genderFilter, statusFilter]);

  const totalPatients = patients.length;

  const newThisWeek = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    return patients.filter((patient) => {
      const rawDate = getPatientDate(patient);
      if (!rawDate) return false;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return false;
      return date >= sevenDaysAgo && date <= now;
    }).length;
  }, [patients]);

  const femaleCount = useMemo(() => {
    return patients.filter(
      (patient) => String(getPatientGender(patient)).toUpperCase() === "FEMALE"
    ).length;
  }, [patients]);

  const profileCompletionRate = totalPatients
    ? (
        (patients.filter((patient) => patient?.phone && patient?.bloodGroup)
          .length /
          totalPatients) *
        100
      ).toFixed(1)
    : "0.0";

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
  };

  const handleCloseModal = () => {
    setSelectedPatient(null);
  };

  const handleDeletePatient = async (patient) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${getPatientName(patient)}?`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5015/api/admin/patients/${patient._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete patient");
        return;
      }

      setPatients((prev) => prev.filter((item) => item._id !== patient._id));

      if (selectedPatient && selectedPatient._id === patient._id) {
        setSelectedPatient(null);
      }

      alert("Patient deleted successfully");
    } catch (err) {
      console.error("Delete patient error:", err);
      alert("Something went wrong while deleting patient");
    }
  };

  return (
    <div className="admin-patients-layout">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <AdminSidebar />

      <div className="admin-patients-main">
        <header className="admin-patients-topbar">
          <div className="admin-patients-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search patient registry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <main className="admin-patients-content">
          <div className="admin-patients-header">
            <div>
              <h1>Patient Registry</h1>
              <p>Oversee and manage your clinical data ecosystem.</p>
            </div>

            <div className="admin-patients-header-actions">
              <button className="primary-btn" type="button">
                <span className="material-symbols-outlined">person_add</span>
                Onboard Patient
              </button>
            </div>
          </div>

          <section className="patient-stats-grid">
            <div className="glass-card patient-stat-card">
              <p className="stat-label">TOTAL PATIENTS</p>
              <h2>{totalPatients.toLocaleString()}</h2>
              <div className="stat-note positive">
                <span className="material-symbols-outlined">groups</span>
                Real count from registry
              </div>
            </div>

            <div className="glass-card patient-stat-card">
              <p className="stat-label">NEW THIS WEEK</p>
              <h2>{newThisWeek.toLocaleString()}</h2>
              <div className="stat-note muted">
                <span className="material-symbols-outlined">schedule</span>
                Female patients: {femaleCount}
              </div>
            </div>

            <div className="glass-card patient-stat-card bordered">
              <p className="stat-label">PROFILE COMPLETION</p>
              <h2>{profileCompletionRate}%</h2>
              <div className="stat-note calm">
                <span className="material-symbols-outlined">check_circle</span>
                Based on phone and blood group
              </div>
            </div>
          </section>

          <div className="patient-table-shell">
            <div className="patient-filters-bar">
              <div className="filter-title">
                <span className="material-symbols-outlined">filter_list</span>
                <span>Filters</span>
              </div>

              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                {genderOptions.map((gender) => (
                  <option key={gender} value={gender}>
                    Gender: {gender}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">Blood Group: All</option>
                <option value="A+">Blood Group: A+</option>
                <option value="A-">Blood Group: A-</option>
                <option value="B+">Blood Group: B+</option>
                <option value="B-">Blood Group: B-</option>
                <option value="AB+">Blood Group: AB+</option>
                <option value="AB-">Blood Group: AB-</option>
                <option value="O+">Blood Group: O+</option>
                <option value="O-">Blood Group: O-</option>
              </select>

              <div className="date-box">
                <span className="material-symbols-outlined">calendar_today</span>
                <input type="text" placeholder="Date Range" readOnly />
              </div>

              <button
                className="reset-btn"
                type="button"
                onClick={() => {
                  setGenderFilter("All");
                  setStatusFilter("All");
                  setSearchTerm("");
                }}
              >
                Reset All
              </button>
            </div>

            <div className="patient-table-wrap">
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Patient ID</th>
                    <th>Contact</th>
                    <th>Gender</th>
                    <th>Blood Group</th>
                    <th>Created Date</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>
                        Loading patients...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>
                        {error}
                      </td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>
                        No patients found
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient, index) => {
                      const name = getPatientName(patient);
                      const age = getPatientAge(patient);
                      const gender = getPatientGender(patient);
                      const bloodGroup = getPatientBloodGroup(patient);

                      return (
                        <tr key={patient._id || patient.userId || index}>
                          <td>
                            <div className="patient-cell">
                              <div
                                className={`avatar ${
                                  index % 3 === 0
                                    ? "soft"
                                    : index % 3 === 1
                                    ? "dark"
                                    : "blue"
                                }`}
                              >
                                {getInitials(name)}
                              </div>

                              <div>
                                <p className="patient-name">{name}</p>
                                <p className="patient-meta">
                                  Age: {age ?? "-"} • {getPatientEmail(patient)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td>{getPatientId(patient)}</td>
                          <td>{getPatientPhone(patient)}</td>
                          <td>{gender}</td>
                          <td>
                            <span className="status-pill active">{bloodGroup}</span>
                          </td>
                          <td>{formatDate(getPatientDate(patient))}</td>

                          <td className="right">
                            <div className="row-actions">
                              <button
                                type="button"
                                onClick={() => handleViewPatient(patient)}
                                title="View"
                              >
                                <span className="material-symbols-outlined">
                                  visibility
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePatient(patient)}
                                title="Delete"
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

            <div className="patient-pagination">
              <p>
                Showing 1 to {filteredPatients.length} of {totalPatients} patients
              </p>

              <div className="pagination-buttons">
                <button type="button">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="active" type="button">
                  1
                </button>
                <button type="button">2</button>
                <button type="button">3</button>
                <button type="button">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <section className="patients-bottom-grid">
            <div className="glass-card ai-card">
              <div className="ai-card-top">
                <div className="pulse-dot"></div>
                <h3>Registry Insight</h3>
              </div>

              <p>
                Current registry contains <strong>{totalPatients}</strong> patients.
                New registrations this week are <strong>{newThisWeek}</strong>.{" "}
                <strong>{profileCompletionRate}%</strong> have key profile details
                completed.
              </p>

              <button className="text-link" type="button">
                View Patient Insights
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </section>
        </main>
      </div>

      {selectedPatient && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "640px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0 }}>Patient Details</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: "700",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <p><strong>Name:</strong> {getPatientName(selectedPatient)}</p>
              <p><strong>Patient ID:</strong> {getPatientId(selectedPatient)}</p>
              <p><strong>Email:</strong> {getPatientEmail(selectedPatient)}</p>
              <p><strong>Phone:</strong> {getPatientPhone(selectedPatient)}</p>
              <p><strong>Gender:</strong> {getPatientGender(selectedPatient)}</p>
              <p><strong>Blood Group:</strong> {getPatientBloodGroup(selectedPatient)}</p>
              <p><strong>Age:</strong> {getPatientAge(selectedPatient) ?? "-"}</p>
              <p><strong>Date of Birth:</strong> {formatDate(selectedPatient?.dateOfBirth)}</p>
              <p><strong>Created Date:</strong> {formatDate(getPatientDate(selectedPatient))}</p>
              <p>
                <strong>Address:</strong>{" "}
                {selectedPatient?.address
                  ? [
                      selectedPatient?.address?.street,
                      selectedPatient?.address?.city,
                      selectedPatient?.address?.state,
                      selectedPatient?.address?.zipCode,
                      selectedPatient?.address?.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"
                  : "-"}
              </p>
              <p>
                <strong>Emergency Contact:</strong>{" "}
                {selectedPatient?.emergencyContact
                  ? [
                      selectedPatient?.emergencyContact?.name,
                      selectedPatient?.emergencyContact?.relationship,
                      selectedPatient?.emergencyContact?.phone,
                    ]
                      .filter(Boolean)
                      .join(" • ") || "-"
                  : "-"}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "24px",
              }}
            >
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  border: "none",
                  background: "#0b2341",
                  color: "#fff",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}