import React from "react";
import defaultUserImg from "../../assets/user.png";

const BookingDoctorInfo = ({ doctor }) => {
  if (!doctor) return null;

  return (
    <div className="booking-doctor-card">
      <div className="booking-doctor-avatar">
        <img 
          src={doctor?.image || defaultUserImg} 
          alt={doctor?.name || 'Doctor'}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultUserImg;
          }}
        />
      </div>

      <div className="booking-doctor-details">
        <div className="booking-doctor-header">
          <h2>{doctor.name}</h2>
          <span className="doctor-specialty-tag">{doctor.specialty}</span>
        </div>

        <p className="doctor-bio">
          {doctor.raw?.about || `Expert in ${doctor.specialty} with extensive clinical experience.`}
        </p>

        <div className="doctor-stats">
          <span className="stat-item">⭐ {doctor.rating || '4.8'}</span>
          <span className="stat-item">{doctor.experience || '10+ Years'} Exp</span>
          <span className="stat-item">🏥 {doctor.hospital}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingDoctorInfo;