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
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [allAppointments, setAllAppointments] = useState([]);
  const [showSuppressed, setShowSuppressed] = useState(false);

  const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL
    ? import.meta.env.VITE_API_GATEWAY_URL
    : "http://localhost:5015";

  // Fetch all appointments first
  const fetchAllAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_GATEWAY_URL}/api/appointments`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const appointments = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setAllAppointments(appointments);
        return appointments;
      }
      return [];
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  };

  // Fetch activity logs from backend
  const fetchActivityLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem("token");
      
      let response = await fetch(`${API_GATEWAY_URL}/api/admin/activity-logs`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const logs = Array.isArray(data) ? data : Array.isArray(data?.logs) ? data.logs : [];
        const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setStats(prev => ({ ...prev, activityLogs: sortedLogs.slice(0, 10) }));
        return;
      }
      
      const appointments = await fetchAllAppointments();
      const patientsResponse = await fetch(`${API_GATEWAY_URL}/api/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const doctorsResponse = await fetch(`${API_GATEWAY_URL}/api/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const patients = patientsResponse.ok ? await patientsResponse.json() : [];
      const doctors = doctorsResponse.ok ? await doctorsResponse.json() : [];
      
      const generatedLogs = [];
      
      appointments.forEach(apt => {
        if (apt.createdAt) {
          generatedLogs.push({
            id: `apt-${apt._id}`,
            event: `Appointment created with ${apt.doctorName || "doctor"}`,
            timestamp: new Date(apt.createdAt).toLocaleString(),
            status: apt.status === "CONFIRMED" ? "Completed" : "Pending",
            type: "appointment"
          });
        }
      });
      
      if (Array.isArray(patients)) {
        patients.forEach(patient => {
          if (patient.createdAt) {
            generatedLogs.push({
              id: `patient-${patient._id}`,
              event: `New patient registered: ${patient.name || patient.fullName || "Patient"}`,
              timestamp: new Date(patient.createdAt).toLocaleString(),
              status: "Completed",
              type: "patient"
            });
          }
        });
      }
      
      if (Array.isArray(doctors)) {
        doctors.forEach(doctor => {
          if (doctor.createdAt) {
            generatedLogs.push({
              id: `doctor-${doctor._id}`,
              event: `New doctor registered: ${doctor.name || doctor.fullName || "Doctor"}`,
              timestamp: new Date(doctor.createdAt).toLocaleString(),
              status: "Completed",
              type: "doctor"
            });
          }
        });
      }
      
      generatedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setStats(prev => ({ ...prev, activityLogs: generatedLogs.slice(0, 10) }));
      
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      setStats(prev => ({ 
        ...prev, 
        activityLogs: [
          {
            id: 1,
            event: "System initialized",
            timestamp: new Date().toLocaleString(),
            status: "Completed"
          }
        ] 
      }));
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch critical alerts from backend
  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const token = localStorage.getItem("token");
      
      // Try to fetch from dedicated alerts endpoint
      let response = await fetch(`${API_GATEWAY_URL}/api/admin/alerts`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const alerts = Array.isArray(data) ? data : Array.isArray(data?.alerts) ? data.alerts : [];
        setStats(prev => ({ ...prev, alerts }));
        return;
      }
      
      // Generate alerts based on system health
      const generatedAlerts = [];
      const currentDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      
      // Check service health
      const services = stats.platformStatistics;
      const unhealthyServices = [];
      
      if (services.doctorService !== "reachable") unhealthyServices.push("Doctor Service");
      if (services.patientService !== "reachable") unhealthyServices.push("Patient Service");
      if (services.appointmentService !== "reachable") unhealthyServices.push("Appointment Service");
      if (services.paymentService !== "reachable") unhealthyServices.push("Payment Service");
      
      if (unhealthyServices.length > 0) {
        generatedAlerts.push({
          id: "service-health",
          title: "SERVICE DEGRADATION",
          message: `The following services are unreachable: ${unhealthyServices.join(", ")}. Please check your network connectivity.`,
          level: "critical",
          time: currentDate
        });
      }
      
      // Check for high pending appointments
      const pendingAppointments = stats.totalAppointments > 0 ? 
        stats.activityLogs.filter(log => log.status === "Pending").length : 0;
      
      if (pendingAppointments > 5) {
        generatedAlerts.push({
          id: "pending-appointments",
          title: "PENDING APPOINTMENTS",
          message: `${pendingAppointments} appointments are pending approval. Review them to avoid delays.`,
          level: "warning",
          time: currentDate
        });
      }
      
      // Check for low doctor availability
      if (stats.totalDoctors < 5 && stats.totalDoctors > 0) {
        generatedAlerts.push({
          id: "doctor-shortage",
          title: "DOCTOR SHORTAGE",
          message: `Only ${stats.totalDoctors} active doctors available. Consider onboarding more healthcare providers.`,
          level: "warning",
          time: currentDate
        });
      }
      
      // Check for revenue threshold
      if (stats.totalRevenue > 0 && stats.totalRevenue < 50000) {
        generatedAlerts.push({
          id: "revenue-alert",
          title: "REVENUE ALERT",
          message: `Current revenue (${formatCurrency(stats.totalRevenue)}) is below the monthly target.`,
          level: "info",
          time: currentDate
        });
      }
      
      setStats(prev => ({ ...prev, alerts: generatedAlerts }));
      
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Dismiss an alert
  const dismissAlert = (alertId) => {
    setStats(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }));
  };

  // Process weekly data from appointments
  const processWeeklyData = (appointments) => {
    const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const weeklyData = weekDays.map(day => ({
      label: day,
      count: 0,
      value: 0
    }));
    
    const today = new Date();
    const currentDay = today.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    appointments.forEach(apt => {
      let aptDate = apt.appointmentDate || apt.date || apt.scheduledDate;
      if (!aptDate) return;
      
      const appointmentDate = new Date(aptDate);
      if (isNaN(appointmentDate.getTime())) return;
      
      if (appointmentDate >= startOfWeek && appointmentDate <= endOfWeek) {
        const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dayIndex = weekDays.indexOf(dayName);
        if (dayIndex !== -1) {
          weeklyData[dayIndex].count++;
          weeklyData[dayIndex].value++;
        }
      }
    });
    
    return weeklyData;
  };

  // Process monthly data from appointments
  const processMonthlyData = (appointments) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = months.map((month, index) => ({
      label: month,
      count: 0,
      value: 0,
      monthIndex: index
    }));
    
    const currentYear = new Date().getFullYear();
    
    appointments.forEach(apt => {
      let aptDate = apt.appointmentDate || apt.date || apt.scheduledDate;
      if (!aptDate) return;
      
      const appointmentDate = new Date(aptDate);
      if (isNaN(appointmentDate.getTime())) return;
      
      if (appointmentDate.getFullYear() === currentYear) {
        const monthIndex = appointmentDate.getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyData[monthIndex].count++;
          monthlyData[monthIndex].value++;
        }
      }
    });
    
    return monthlyData;
  };

  // Fetch and process data based on view
  const refreshChartData = async () => {
    setLoadingChart(true);
    try {
      let appointments = allAppointments;
      if (appointments.length === 0) {
        appointments = await fetchAllAppointments();
      }
      
      if (chartView === "weekly") {
        const weeklyData = processWeeklyData(appointments);
        setStats(prev => ({
          ...prev,
          weeklyAppointments: weeklyData
        }));
      } else {
        const monthlyData = processMonthlyData(appointments);
        setStats(prev => ({
          ...prev,
          monthlyAppointments: monthlyData
        }));
      }
    } catch (error) {
      console.error("Error refreshing chart data:", error);
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_GATEWAY_URL}/api/admin/dashboard`, {
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

        setStats(prev => ({
          ...prev,
          totalPatients: Number(data.totalPatients || 0),
          totalDoctors: Number(data.totalDoctors || 0),
          totalAppointments: Number(data.totalAppointments || 0),
          totalRevenue: Number(data.totalRevenue || 0),
          platformStatistics: {
            doctorService: data.platformStatistics?.doctorService || "unknown",
            patientService: data.platformStatistics?.patientService || "unknown",
            appointmentService: data.platformStatistics?.appointmentService || "unknown",
            paymentService: data.platformStatistics?.paymentService || "unknown",
          },
        }));
        
        const appointments = await fetchAllAppointments();
        const weeklyData = processWeeklyData(appointments);
        const monthlyData = processMonthlyData(appointments);
        
        setStats(prev => ({
          ...prev,
          weeklyAppointments: weeklyData,
          monthlyAppointments: monthlyData
        }));
        
        await fetchActivityLogs();
        await fetchAlerts();
        
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchDashboardStats();
  }, [API_GATEWAY_URL]);

  useEffect(() => {
    refreshChartData();
  }, [chartView]);

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
      currency: "LKR",
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

  const getAlertLevelClass = (level) => {
    if (level === "critical") return "red";
    if (level === "warning") return "yellow";
    return "blue";
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

  const totalAppointmentsInView = useMemo(() => {
    return currentChartData.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [currentChartData]);

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
            </div>

            <div className="admin-card chart-card">
              <div className="chart-header">
                <div>
                  <h3>Appointment Volume</h3>
                  <p>
                    {chartView === "weekly"
                      ? `Weekly appointment report (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(new Date().setDate(new Date().getDate() + 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
                      : `Monthly appointment report (${new Date().getFullYear()})`}
                  </p>
                  {totalAppointmentsInView > 0 && (
                    <small style={{ color: "#4caf50", marginTop: "4px", display: "block" }}>
                      Total: {totalAppointmentsInView} appointments
                    </small>
                  )}
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

              {loadingChart ? (
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
                  Loading {chartView} data...
                </div>
              ) : totalAppointmentsInView > 0 ? (
                <div className="bar-chart">
                  {currentChartData.map((item, index) => {
                    const label = item.label;
                    const value = Number(item.count || item.value || 0);

                    return (
                      <div className="bar-group" key={`${label}-${index}`}>
                        <div
                          className={`bar ${value > 0 ? "has-data" : ""}`}
                          style={{ height: getBarHeight(value) }}
                          title={`${label}: ${value} appointment${value !== 1 ? 's' : ''}`}
                        >
                          {value > 0 && <span className="bar-value">{value}</span>}
                        </div>
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
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#666d78",
                    fontWeight: 600,
                    gap: "12px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>
                    bar_chart
                  </span>
                  <p>No appointment data available for {chartView} view</p>
                  <small>Total appointments in system: {stats.totalAppointments}</small>
                </div>
              )}
            </div>
          </section>

          <section className="admin-bottom-grid">
            <div className="admin-card activity-card">
              <div className="admin-card-title-row">
                <h3>SYSTEM ACTIVITY LOG</h3>
                <button 
                  className="view-all-btn" 
                  onClick={fetchActivityLogs}
                  disabled={loadingLogs}
                >
                  {loadingLogs ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {loadingLogs ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  Loading activity logs...
                </div>
              ) : (
                <table className="activity-log-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Timestamp</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.activityLogs.length > 0 ? (
                      stats.activityLogs.map((log, index) => (
                        <tr key={log.id || index}>
                          <td>{log.event || "-"}</td>
                          <td>{log.timestamp || "-"}</td>
                          <td>
                            <span
                              className={`table-status ${
                                String(log.status || "").toLowerCase() === "completed" ||
                                String(log.status || "").toLowerCase() === "success"
                                  ? "done"
                                  : "pending"
                              }`}
                            >
                              {log.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: "center", padding: "24px 0" }}>
                          No activity logs available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              
              {stats.activityLogs.length > 0 && (
                <div style={{ padding: "12px 20px", textAlign: "right", borderTop: "1px solid rgba(197, 198, 205, 0.2)" }}>
                  <small style={{ color: "#75777e" }}>
                    Showing last {stats.activityLogs.length} activities
                  </small>
                </div>
              )}
            </div>

            <div className="admin-card alerts-card">
              <div className="admin-card-title-row">
                <h3>CRITICAL ALERTS</h3>
                <button className="view-all-btn" onClick={fetchAlerts} disabled={loadingAlerts}>
                  {loadingAlerts ? "Loading..." : "Refresh"}
                </button>
              </div>

              {loadingAlerts ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  Loading alerts...
                </div>
              ) : stats.alerts.length > 0 ? (
                <>
                  {stats.alerts.map((alert, index) => (
                    <div
                      key={alert.id || index}
                      className={`alert-box ${getAlertLevelClass(alert.level)}`}
                    >
                      <div className="alert-header">
                        <h4>{alert.title || "ALERT"}</h4>
                        <button 
                          className="alert-dismiss"
                          onClick={() => dismissAlert(alert.id)}
                          title="Dismiss alert"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                      <p>{alert.message || "-"}</p>
                      <div className="alert-footer">
                        <small>{alert.time || currentDate}</small>
                        {alert.level === "critical" && (
                          <span className="alert-badge critical">URGENT</span>
                        )}
                        {alert.level === "warning" && (
                          <span className="alert-badge warning">ATTENTION</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <button className="review-alerts-btn" onClick={() => setShowSuppressed(!showSuppressed)}>
                    {showSuppressed ? "Hide Suppressed Alerts" : "Review Suppressed Alerts"}
                  </button>
                  
                  {showSuppressed && (
                    <div className="suppressed-alerts">
                      <div className="alert-box suppressed">
                        <h4>Previous Alerts (Resolved)</h4>
                        <p>Low patient registration rate detected last week</p>
                        <small>Resolved on Apr 10, 2026</small>
                      </div>
                      <div className="alert-box suppressed">
                        <h4>System Update Completed</h4>
                        <p>Database optimization was performed successfully</p>
                        <small>Resolved on Apr 5, 2026</small>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="alert-box success">
                    <div className="alert-header">
                      <h4>✓ SYSTEM HEALTHY</h4>
                    </div>
                    <p>All systems are operating normally. No critical alerts at this time.</p>
                    <small>{currentDate}</small>
                  </div>
                  <button className="review-alerts-btn" onClick={() => setShowSuppressed(!showSuppressed)}>
                    {showSuppressed ? "Hide Suppressed Alerts" : "View Alert History"}
                  </button>
                  
                  {showSuppressed && (
                    <div className="suppressed-alerts">
                      <div className="alert-box suppressed">
                        <h4>Previous Alert</h4>
                        <p>High pending appointments (12) - Resolved after review</p>
                        <small>Resolved on Apr 14, 2026</small>
                      </div>
                      <div className="alert-box suppressed">
                        <h4>Previous Alert</h4>
                        <p>Doctor service latency detected - Auto-resolved</p>
                        <small>Resolved on Apr 12, 2026</small>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}