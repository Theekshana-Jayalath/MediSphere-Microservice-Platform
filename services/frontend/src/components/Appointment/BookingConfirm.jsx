import React from "react";
import { useNavigate } from "react-router-dom";

// BookingConfirm: navigates to payment page and passes the consultation fee
const BookingConfirm = ({ doctor, selectedTime }) => {
  const navigate = useNavigate();

  // Accept several common fee property names from the doctor object
  const consultationFee =
    doctor?.fee ?? doctor?.consultationFee ?? doctor?.price ?? 0;

  const handleConfirm = () => {
    if (!selectedTime) return; // guard
    navigate('/payment', { state: { consultationFee, doctor, selectedTime } });
  };

  return (
    <div className="confirm-booking-wrapper">
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button onClick={handleConfirm} className="confirm-booking-btn" disabled={!selectedTime} aria-disabled={!selectedTime}>Confirm Booking →</button>
          {!selectedTime && <div className="text-xs text-red-600 mt-2">Please select a time slot before confirming.</div>}
        </div>
      </div>
    </div>
  );
};

export default BookingConfirm;