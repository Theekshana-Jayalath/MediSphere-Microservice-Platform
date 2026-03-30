import React from "react";

const BookingDoctorInfo = ({ doctor }) => {
  return (
    <div className="booking-doctor-card">
      <img
        src={doctor?.image || "https://randomuser.me/api/portraits/men/32.jpg"}
        alt="doctor"
        className="booking-doctor-img"
      />

      <div className="booking-doctor-details">
        <div className="booking-doctor-header">
          <h2>Dr. Julian Vance</h2>
          <span className="doctor-tag">Senior Cardiologist</span>
        </div>

        <p className="doctor-description">
          Expert in non-invasive cardiology and preventative heart care. Dr.
          Vance has over 15 years of experience at leading medical
          institutions, specializing in complex cardiac diagnostics.
        </p>

        <div className="doctor-meta" style={{ display: 'flex', gap: '12px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>⭐ 4.9</span>
          <span>15+ Years Exp</span>
          <span>English, Spanish</span>
          <span>Board Certified</span>
        </div>
      </div>
    </div>
  );
};

export default BookingDoctorInfo;