import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../styles/Admin/AdminAppointments.css";

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const APPOINTMENTS_API =
    import.meta.env.VITE_API_GATEWAY_URL
      ? `${import.meta.env.VITE_API_GATEWAY_URL}/api/appointments`
      : "http://localhost:5015/api/appointments";

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const res = await fetch(APPOINTMENTS_API, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch appointments");
        }

        const data = await res.json();

        const appointmentList = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : [];

        setAppointments(appointmentList);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [APPOINTMENTS_API]);

  const getDisplayPatientId = (appointment) => {
    return (
      appointment.patientPatientId ||
      appointment.patientDisplayId ||
      appointment.patientCode ||
      appointment.patientCodeId ||
      appointment.patientRegNo ||
      appointment.patient?.patientId ||
      appointment.patient?.patientCode ||
      appointment.patient?.patientDisplayId ||
      appointment.patientId ||
      "-"
    );
  };

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return appointments;

    return appointments.filter((appointment) => {
      return (
        String(getDisplayPatientId(appointment)).toLowerCase().includes(q) ||
        String(appointment.doctorName || "").toLowerCase().includes(q) ||
        String(appointment.appointmentType || "").toLowerCase().includes(q) ||
        String(appointment.status || "").toLowerCase().includes(q) ||
        String(appointment.paymentStatus || "").toLowerCase().includes(q) ||
        String(appointment.appointmentDate || "").toLowerCase().includes(q)
      );
    });
  }, [appointments, search]);

  const stats = useMemo(() => {
    const totalAppointments = appointments.length;

    const pendingApproval = appointments.filter((item) =>
      ["PENDING", "PENDING_PAYMENT", "PENDING_DOCTOR_APPROVAL"].includes(
        String(item.status || "").toUpperCase()
      )
    ).length;

    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    const todayAppointments = appointments.filter((item) => {
      if (!item.appointmentDate) return false;
      const dateString = new Date(item.appointmentDate)
        .toISOString()
        .split("T")[0];
      return dateString === todayString;
    });

    const nextAppointment = todayAppointments
      .slice()
      .sort((a, b) =>
        String(a.startTime || "").localeCompare(String(b.startTime || ""))
      )[0];

    return {
      totalAppointments,
      pendingApproval,
      todayCases: todayAppointments.length,
      nextAppointment,
    };
  }, [appointments]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const formatDateTimeRange = (appointment) => {
    const dateText = formatDate(appointment.appointmentDate);
    const start = appointment.startTime || "-";
    const end = appointment.endTime || "-";
    return {
      dateText,
      timeText: `${start} - ${end}`,
    };
  };

  const getTypeClass = (type) => {
    const value = String(type || "").toUpperCase();
    if (value === "ONLINE") return "appt-type online";
    return "appt-type physical";
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toUpperCase();

    if (value === "CONFIRMED") return "appt-status confirmed";
    if (value === "CANCELLED") return "appt-status cancelled";
    if (
      value === "PENDING" ||
      value === "PENDING_PAYMENT" ||
      value === "PENDING_DOCTOR_APPROVAL"
    ) {
      return "appt-status pending";
    }

    if (value === "REJECTED") return "appt-status cancelled";

    return "appt-status";
  };

  const formatStatus = (status) => {
    const value = String(status || "").replaceAll("_", " ");
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  const handleExportData = () => {
    const rows = filteredAppointments.map((appointment) => ({
      patientId: getDisplayPatientId(appointment),
      doctorId: appointment.doctorId || "",
      doctorName: appointment.doctorName || "",
      specialization: appointment.specialization || "",
      hospital: appointment.hospital || "",
      appointmentType: appointment.appointmentType || "",
      appointmentDate: appointment.appointmentDate
        ? new Date(appointment.appointmentDate).toLocaleDateString()
        : "",
      startTime: appointment.startTime || "",
      endTime: appointment.endTime || "",
      duration: appointment.duration || "",
      status: appointment.status || "",
      paymentStatus: appointment.paymentStatus || "",
      createdAt: appointment.createdAt
        ? new Date(appointment.createdAt).toLocaleString()
        : "",
      appointmentId: appointment._id || "",
    }));

    const headers = [
      "Patient ID",
      "Doctor ID",
      "Doctor Name",
      "Specialization",
      "Hospital",
      "Appointment Type",
      "Appointment Date",
      "Start Time",
      "End Time",
      "Duration",
      "Status",
      "Payment Status",
      "Created At",
      "Appointment ID",
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
          row.patientId,
          row.doctorId,
          row.doctorName,
          row.specialization,
          row.hospital,
          row.appointmentType,
          row.appointmentDate,
          row.startTime,
          row.endTime,
          row.duration,
          row.status,
          row.paymentStatus,
          row.createdAt,
          row.appointmentId,
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
    link.setAttribute("download", `appointments-registry-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-appointments-page">
      <AdminSidebar activeItem="appointments" />

      <main className="admin-appointments-main">
        <header className="appointments-topbar">
          <div className="appointments-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search patients or records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <section className="appointments-summary-grid">
          <div className="summary-card">
            <div className="summary-card-head">
              <div className="summary-icon light">
                <span className="material-symbols-outlined">
                  event_available
                </span>
              </div>
              <span className="summary-pill">Live Data</span>
            </div>
            <h3>Total Appointments</h3>
            <p>{stats.totalAppointments}</p>
          </div>

          <div className="summary-card">
            <div className="summary-card-head">
              <div className="summary-icon soft">
                <span className="material-symbols-outlined">
                  pending_actions
                </span>
              </div>
              <span className="summary-pill danger">Needs Review</span>
            </div>
            <h3>Pending Approval</h3>
            <p>{stats.pendingApproval}</p>
          </div>

          <div className="summary-card primary">
            <div className="summary-card-head">
              <div className="summary-icon dark">
                <span className="material-symbols-outlined">schedule</span>
              </div>
            </div>
            <h3>Today's Schedule</h3>
            <p>{stats.todayCases} Cases</p>
            <small>
              Next:{" "}
              {stats.nextAppointment
                ? `${stats.nextAppointment.doctorName || "Doctor"} (${
                    stats.nextAppointment.startTime || "-"
                  })`
                : "No appointment today"}
            </small>
          </div>
        </section>

        <section className="registry-section">
          <div className="registry-header">
            <div>
              <h2>Appointment Registry</h2>
              <p>Real-time status of all clinical consultations</p>
            </div>

            <div className="registry-actions">
              <button type="button" className="secondary-btn">
                <span className="material-symbols-outlined">filter_list</span>
                Filter
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={handleExportData}
              >
                <span className="material-symbols-outlined">download</span>
                Export Data
              </button>
            </div>
          </div>

          {loading ? (
            <div className="state-box">Loading appointments...</div>
          ) : error ? (
            <div className="state-box error">{error}</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="state-box">No appointments found.</div>
          ) : (
            <>
              <div className="appointments-table-wrapper">
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date &amp; Time</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment) => {
                      const dateTime = formatDateTimeRange(appointment);

                      return (
                        <tr key={appointment._id}>
                          <td>
                            <p className="main-text">
                              {getDisplayPatientId(appointment)}
                            </p>
                          </td>

                          <td>
                            <p className="main-text">
                              {appointment.doctorName || "-"}
                            </p>
                          </td>

                          <td>
                            <div>
                              <p className="main-text">{dateTime.dateText}</p>
                              <span className="sub-text">{dateTime.timeText}</span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={getTypeClass(
                                appointment.appointmentType
                              )}
                            >
                              <span className="material-symbols-outlined">
                                {String(appointment.appointmentType).toUpperCase() ===
                                "ONLINE"
                                  ? "videocam"
                                  : "apartment"}
                              </span>
                              {appointment.appointmentType || "-"}
                            </span>
                          </td>

                          <td>
                            <span className={getStatusClass(appointment.status)}>
                              <span className="status-dot"></span>
                              {formatStatus(appointment.status || "UNKNOWN")}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`payment-badge ${
                                String(appointment.paymentStatus || "").toUpperCase() ===
                                "PENDING"
                                  ? "pending"
                                  : "paid"
                              }`}
                            >
                              {formatStatus(
                                appointment.paymentStatus || "UNKNOWN"
                              )}
                            </span>
                          </td>

                          <td className="text-right">
                            <button
                              type="button"
                              className="view-btn"
                              onClick={() => setSelectedAppointment(appointment)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <p>
                  Showing {filteredAppointments.length} of {appointments.length}{" "}
                  appointments
                </p>

                <div className="pagination">
                  <button type="button">
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
            </>
          )}
        </section>
      </main>

      {selectedAppointment && (
        <div
          className="appointment-modal-overlay"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className="appointment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="appointment-modal-header">
              <h3>Appointment Details</h3>
              <button
                type="button"
                className="appointment-modal-close"
                onClick={() => setSelectedAppointment(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="appointment-modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Patient ID</label>
                  <p>{getDisplayPatientId(selectedAppointment)}</p>
                </div>

                <div className="detail-item">
                  <label>Doctor ID</label>
                  <p>{selectedAppointment.doctorId || "-"}</p>
                </div>

                <div className="detail-item">
                  <label>Doctor Name</label>
                  <p>{selectedAppointment.doctorName || "-"}</p>
                </div>

                <div className="detail-item">
                  <label>Specialization</label>
                  <p>{selectedAppointment.specialization || "-"}</p>
                </div>

                <div className="detail-item">
                  <label>Hospital</label>
                  <p>{selectedAppointment.hospital || "-"}</p>
                </div>

                <div className="detail-item">
                  <label>Appointment Type</label>
                  <p>{selectedAppointment.appointmentType || "-"}</p>
                </div>

                <div className="detail-item">
                  <label>Appointment Date</label>
                  <p>{formatDate(selectedAppointment.appointmentDate)}</p>
                </div>

                <div className="detail-item">
                  <label>Start Time</label>
                  <p>{selectedAppointment.startTime || "-"}</p>
                </div>

                <div className="detail-item">
                  <label>End Time</label>
                  <p>{selectedAppointment.endTime || "-"}</p>
                </div>

                <div className="detail-item">
                  <label>Duration</label>
                  <p>{selectedAppointment.duration || "-"} mins</p>
                </div>

                <div className="detail-item">
                  <label>Status</label>
                  <p>{formatStatus(selectedAppointment.status || "UNKNOWN")}</p>
                </div>

                <div className="detail-item">
                  <label>Payment Status</label>
                  <p>
                    {formatStatus(
                      selectedAppointment.paymentStatus || "UNKNOWN"
                    )}
                  </p>
                </div>

                <div className="detail-item full">
                  <label>Appointment ID</label>
                  <p>{selectedAppointment._id || "-"}</p>
                </div>

                <div className="detail-item full">
                  <label>Created At</label>
                  <p>
                    {selectedAppointment.createdAt
                      ? new Date(selectedAppointment.createdAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}