import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import { todayAppointments } from "../../data/doctorDashboardData";

const DoctorTelemedicine = () => {
  const telemedicineAppointments = todayAppointments.filter(
    (appointment) => appointment.type === "Video Call"
  );

  return (
    <div className="dashboard-layout">
      <DoctorSidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div>
            <h1 className="page-title">Telemedicine Session</h1>
            <p className="page-subtitle">
              Start or manage your active video consultations.
            </p>
          </div>
        </div>

        <div className="dashboard-card telemedicine-card">
          <div className="card-header">
            <h2>Upcoming Video Sessions</h2>
          </div>

          {telemedicineAppointments.length > 0 ? (
            <div className="telemedicine-list">
              {telemedicineAppointments.map((appointment) => (
                <div key={appointment.id} className="telemedicine-item">
                  <div>
                    <h3>{appointment.patientName}</h3>
                    <p>{appointment.time}</p>
                    <p>{appointment.reason}</p>
                  </div>
                  <button className="ms-btn-primary">Join Session</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No telemedicine sessions scheduled for today.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorTelemedicine;
