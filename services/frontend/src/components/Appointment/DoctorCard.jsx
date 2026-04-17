import React from "react";
import { useNavigate } from "react-router-dom";
import defaultUserImg from "../../assets/user.png";

const DoctorCard = ({ doctor, selectedDate, setDateError }) => {
  const navigate = useNavigate();

  const handleBookNow = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!selectedDate) {
      setDateError('Please select an appointment date');
      return;
    }
    // Prevent booking for past dates
    if (selectedDate < todayStr) {
      setDateError('Cannot book for a past date');
      return;
    }
    setDateError(false);
    // Match the route path from appointmentRoutes
    navigate("/appointment/booking", {
      state: { 
        doctor: doctor,
        selectedDate: selectedDate 
      }
    });
  };

  const getImageSrc = () => {
    if (doctor.image && doctor.image !== "") {
      return doctor.image;
    }
    return defaultUserImg;
  };

  return (
    <div className="doctor-card">
      <div className="doctor-card-image">
        <img 
          src={getImageSrc()} 
          alt={doctor.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultUserImg;
          }}
        />
      </div>
      <div className="doctor-card-content">
        <h3 className="doctor-name" title={doctor.name}>
          {doctor.name}
        </h3>
        <p className="doctor-specialty">{doctor.specialty}</p>
        <p className="doctor-hospital" title={doctor.hospital}>
          {doctor.hospital}
        </p>
        <div className="doctor-experience">{doctor.experience}</div>
        <button onClick={handleBookNow} className="book-now-btn">
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;