import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import { todayAppointments } from "../../data/doctorDashboardData";

const DoctorAppointments = () => {
  return (
    <div className="dashboard-layout">
      <DoctorSidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div>
            <h1 className="page-title">Appointment Requests</h1>
            <p className="page-subtitle">
              Manage your upcoming patient visits and telemedicine bookings.
            </p>
          </div>
        </div>

        <div className="dashboard-card appointment-page-card">
          {todayAppointments.map((appointment) => (
            <div key={appointment.id} className="appointment-item">
              <div>
                <h3>{appointment.patientName}</h3>
                <p>{appointment.time} • {appointment.type}</p>
              </div>
              <div>
                <p>{appointment.reason}</p>
                <span className={appointment.status === "join-now" ? "appointment-status highlight-item" : "appointment-status"}>
                  {appointment.status === "join-now" ? "JOIN NOW" : appointment.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DoctorAppointments;
