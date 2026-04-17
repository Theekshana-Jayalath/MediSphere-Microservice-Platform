import React from "react";
import { useNavigate } from "react-router-dom";

const BookingConfirm = ({ doctor, selectedTime, selectedDate, selectedConsultation, selectedType }) => {
  const navigate = useNavigate();

  const handleConfirmBooking = () => {
    // Validate consultation type
    if (!selectedType) {
      alert("Please select a consultation type before confirming.");
      return;
    }
    
    // Validate time slot
    if (!selectedTime) {
      alert("Please select a time slot before confirming.");
      return;
    }
    
    navigate("/payment", {
      state: {
        bookingDetails: {
          doctor,
          selectedDate,
          selectedTime,
          selectedConsultation,
          // In some usages, doctor may include a selectedHospital prop or parent passes it in
          selectedHospital: doctor?.selectedHospital || null
        }
      }
    });
  };

  return (
    <div className="booking-confirm-wrapper">
      <button 
        onClick={handleConfirmBooking} 
        className="confirm-booking-btn"
      >
        Confirm Booking →
      </button>
      {(!selectedType || !selectedTime) && (
        <p className="confirm-error-message">
          Please select {!selectedType && !selectedTime ? 'consultation type and time slot' : !selectedType ? 'consultation type' : 'time slot'} before confirming.
        </p>
      )}
    </div>
  );
};

export default BookingConfirm;