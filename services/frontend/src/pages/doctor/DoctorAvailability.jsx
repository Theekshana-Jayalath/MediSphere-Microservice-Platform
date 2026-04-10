import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import { availabilitySlots } from "../../data/doctorDashboardData";

const DoctorAvailability = () => {
  return (
    <div className="dashboard-layout">
      <DoctorSidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div>
            <h1 className="page-title">Availability</h1>
            <p className="page-subtitle">
              Review and update your consultation slots and availability.
            </p>
          </div>
        </div>

        <div className="dashboard-card availability-page-card">
          <div className="card-header">
            <h2>Active Availability Slots</h2>
          </div>

          <div className="availability-list">
            {availabilitySlots.map((slot) => (
              <div key={slot.id} className="availability-card">
                <h3>{slot.time}</h3>
                <p>{slot.department} • {slot.type}</p>
                <p>{slot.hospital}</p>
                <p>{slot.location}</p>
                <p>{slot.booked}/{slot.capacity} booked • {slot.capacity - slot.booked} available</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorAvailability;
