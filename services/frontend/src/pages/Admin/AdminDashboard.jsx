import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../styles/Admin/AdminDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    platformStatistics: {
      doctorService: "unknown",
      patientService: "unknown",
      appointmentService: "unknown",
      paymentService: "unknown",
    },
    weeklyAppointments: [],
    monthlyAppointments: [],
    activityLogs: [],
    alerts: [],
  });

  const [chartView, setChartView] = useState("weekly");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:5015/api/admin/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(data.message || "Failed to fetch dashboard stats");
          return;
        }

        setStats({
          totalPatients: Number(data.totalPatients || 0),
          totalDoctors: Number(data.totalDoctors || 0),
          totalAppointments: Number(data.totalAppointments || 0),
          totalRevenue: Number(data.totalRevenue || 0),
          platformStatistics: {
            doctorService: data.platformStatistics?.doctorService || "unknown",
            patientService: data.platformStatistics?.patientService || "unknown",
            appointmentService:
              data.platformStatistics?.appointmentService || "unknown",
            paymentService: data.platformStatistics?.paymentService || "unknown",
          },
          weeklyAppointments: Array.isArray(data.weeklyAppointments)
            ? data.weeklyAppointments
            : [],
          monthlyAppointments: Array.isArray(data.monthlyAppointments)
            ? data.monthlyAppointments
            : [],
          activityLogs: Array.isArray(data.activityLogs) ? data.activityLogs : [],
          alerts: Array.isArray(data.alerts) ? data.alerts : [],
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchDashboardStats();
  }, []);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const overallOperational = useMemo(() => {
    const services = Object.values(stats.platformStatistics || {});
    return services.length > 0 && services.every((status) => status === "reachable");
  }, [stats.platformStatistics]);

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const getServiceStatusClass = (status) => {
    if (status === "reachable") return "ok";
    if (status === "unreachable") return "down";
    return "warn";
  };

  const getServiceStatusLabel = (status) => {
    if (!status) return "unknown";
    return status;
  };

  const currentChartData =
    chartView === "weekly" ? stats.weeklyAppointments : stats.monthlyAppointments;

  const maxChartValue = useMemo(() => {
    if (!currentChartData.length) return 0;
    return Math.max(
      ...currentChartData.map((item) => Number(item.count || item.value || 0)),
      0
    );
  }, [currentChartData]);

  const getBarHeight = (itemValue) => {
    const value = Number(itemValue || 0);
    if (!maxChartValue || value <= 0) return "0px";
    const minHeight = 60;
    const maxHeight = 240;
    const scaledHeight = (value / maxChartValue) * maxHeight;
    return `${Math.max(minHeight, scaledHeight)}px`;
  };

  return (
    <div className="admin-dashboard-layout">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <AdminSidebar />

      <div className="admin-dashboard-main">
        <header className="admin-topbar">
          <div className="admin-search-box">
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Search analytics..." />
          </div>

          <div className="admin-topbar-right">
            <button className="admin-icon-btn">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="admin-icon-btn">
              <span className="material-symbols-outlined">dark_mode</span>
            </button>
            <button className="admin-report-btn">Create Report</button>

            <div className="admin-profile-box">
              <div>
                <h4>{user?.name || "Main Admin"}</h4>
                <p>{user?.role || "System Admin"}</p>
              </div>
              <img src="https://i.pravatar.cc/100?img=12" alt="admin" />
            </div>
          </div>
        </header>

        <main className="admin-dashboard-content">
          <div className="admin-dashboard-header">
            <div>
              <h1>Etheris Overview</h1>
              <p>Real-time clinical intelligence and system health.</p>
            </div>

            <div className="admin-header-badges">
              <div className="admin-badge operational">
                <span></span>
                {overallOperational ? "Operational" : "Issues Detected"}
              </div>
              <div className="admin-badge">
                <span className="material-symbols-outlined">calendar_today</span>
                {currentDate}
              </div>
            </div>
          </div>

          <section className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <div className="admin-stat-icon light-blue">
                  <span className="material-symbols-outlined">person_search</span>
                </div>
              </div>
              <p>Total Patients</p>
              <h2>{formatNumber(stats.totalPatients)}</h2>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <div className="admin-stat-icon soft-blue">
                  <span className="material-symbols-outlined">
                    medical_information
                  </span>
                </div>
              </div>
              <p>Active Doctors</p>
              <h2>{formatNumber(stats.totalDoctors)}</h2>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <div className="admin-stat-icon soft-gray">
                  <span className="material-symbols-outlined">
                    event_available
                  </span>
                </div>
              </div>
              <p>Appointments</p>
              <h2>{formatNumber(stats.totalAppointments)}</h2>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <div className="admin-stat-icon dark">
                  <span className="material-symbols-outlined">payments</span>
                </div>
              </div>
              <p>Revenue</p>
              <h2>{formatCurrency(stats.totalRevenue)}</h2>
            </div>
          </section>

          <section className="admin-dashboard-grid">
            <div className="admin-left-column">
              <div className="admin-card glass">
                <div className="admin-card-title-row">
                  <h3>MICROSERVICES HEALTH</h3>
                  <span className="material-symbols-outlined success-icon">
                    check_circle
                  </span>
                </div>

                <div className="service-list">
                  <div className="service-item">
                    <span>Doctor Service</span>
                    <span
                      className={`status ${getServiceStatusClass(
                        stats.platformStatistics?.doctorService
                      )}`}
                    >
                      {getServiceStatusLabel(stats.platformStatistics?.doctorService)}
                    </span>
                  </div>

                  <div className="service-item">
                    <span>Patient Service</span>
                    <span
                      className={`status ${getServiceStatusClass(
                        stats.platformStatistics?.patientService
                      )}`}
                    >
                      {getServiceStatusLabel(stats.platformStatistics?.patientService)}
                    </span>
                  </div>

                  <div className="service-item">
                    <span>Appointment Service</span>
                    <span
                      className={`status ${getServiceStatusClass(
                        stats.platformStatistics?.appointmentService
                      )}`}
                    >
                      {getServiceStatusLabel(
                        stats.platformStatistics?.appointmentService
                      )}
                    </span>
                  </div>

                  <div className="service-item">
                    <span>Payment Service</span>
                    <span
                      className={`status ${getServiceStatusClass(
                        stats.platformStatistics?.paymentService
                      )}`}
                    >
                      {getServiceStatusLabel(stats.platformStatistics?.paymentService)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-card quick-actions-card">
                <h3>QUICK ACTIONS</h3>
                <div className="quick-actions-grid">
                  <button>New Doctor</button>
                  <button>Sync DB</button>
                  <button>Audit Log</button>
                  <button>Security</button>
                </div>
              </div>
            </div>

            <div className="admin-card chart-card">
              <div className="chart-header">
                <div>
                  <h3>Appointment Volume</h3>
                  <p>
                    {chartView === "weekly"
                      ? "Showing weekly appointment report."
                      : "Showing monthly appointment report."}
                  </p>
                </div>

                <div className="chart-tabs">
                  <button
                    type="button"
                    className={chartView === "weekly" ? "active" : ""}
                    onClick={() => setChartView("weekly")}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    className={chartView === "monthly" ? "active" : ""}
                    onClick={() => setChartView("monthly")}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {currentChartData.length > 0 ? (
                <div className="bar-chart">
                  {currentChartData.map((item, index) => {
                    const label =
                      item.label ||
                      item.day ||
                      item.week ||
                      item.month ||
                      `Item ${index + 1}`;
                    const value = Number(item.count || item.value || 0);

                    return (
                      <div className="bar-group" key={`${label}-${index}`}>
                        <div
                          className={`bar ${
                            index === currentChartData.length - 1 ? "active" : ""
                          }`}
                          style={{ height: getBarHeight(value) }}
                          title={`${label}: ${value}`}
                        ></div>
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    minHeight: "280px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#666d78",
                    fontWeight: 600,
                  }}
                >
                  No real {chartView} report data available from backend yet.
                </div>
              )}
            </div>
          </section>

          <section className="admin-bottom-grid">
            <div className="admin-card activity-card">
              <div className="admin-card-title-row">
                <h3>SYSTEM ACTIVITY LOG</h3>
                <button className="view-all-btn">View All</button>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Operator</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.activityLogs.length > 0 ? (
                    stats.activityLogs.map((log, index) => (
                      <tr key={log.id || index}>
                        <td>{log.event || "-"}</td>
                        <td>{log.operator || "-"}</td>
                        <td>{log.timestamp || "-"}</td>
                        <td>
                          <span
                            className={`table-status ${
                              String(log.status || "").toLowerCase() === "completed"
                                ? "done"
                                : "pending"
                            }`}
                          >
                            {log.status || "-"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        style={{ textAlign: "center", padding: "24px 0" }}
                      >
                        No real activity log data available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-card alerts-card">
              <div className="admin-card-title-row">
                <h3>CRITICAL ALERTS</h3>
              </div>

              {stats.alerts.length > 0 ? (
                stats.alerts.map((alert, index) => (
                  <div
                    key={alert.id || index}
                    className={`alert-box ${
                      String(alert.level || "").toLowerCase() === "critical"
                        ? "red"
                        : "yellow"
                    }`}
                  >
                    <h4>{alert.title || "ALERT"}</h4>
                    <p>{alert.message || "-"}</p>
                    <small>{alert.time || currentDate}</small>
                  </div>
                ))
              ) : (
                <div className="alert-box yellow">
                  <h4>SYSTEM STATUS</h4>
                  <p>
                    Real alert data is not connected yet. Current service health is
                    shown in the microservices health panel.
                  </p>
                  <small>{currentDate}</small>
                </div>
              )}

              <button className="review-alerts-btn">Review Suppressed Alerts</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}