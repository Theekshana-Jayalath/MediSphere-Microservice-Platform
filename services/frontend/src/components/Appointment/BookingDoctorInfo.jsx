import React from "react";
import userImg from "../../assets/user.png";

const BookingDoctorInfo = ({ doctor }) => {
  if (!doctor) return null;

  return (
    <div className="booking-doctor-card">
      <img
        src={doctor?.image || userImg}
        alt={doctor?.name || 'doctor'}
        className="booking-doctor-img"
      />

      <div className="booking-doctor-details">
        <div className="booking-doctor-header">
          <h2>{doctor.name}</h2>
          <span className="doctor-tag">{doctor.specialty}</span>
        </div>

        <p className="doctor-description">
          {doctor.raw?.about || `Practicing at ${doctor.hospital}.`}
        </p>

        <div className="doctor-meta" style={{ display: 'flex', gap: '12px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>⭐ {doctor.rating ?? 'N/A'}</span>
          <span>{doctor.experience}</span>
          <span>{doctor.raw?.languages?.join(', ') || ''}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingDoctorInfo;