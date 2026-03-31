import React from "react";
import { useNavigate } from "react-router-dom";

// BookingConfirm: navigates to payment page and passes the consultation fee
const BookingConfirm = ({ doctor }) => {
  const navigate = useNavigate();

  // Accept several common fee property names from the doctor object
  const consultationFee =
    doctor?.fee ?? doctor?.consultationFee ?? doctor?.price ?? 0;

  const handleConfirm = () => {
    navigate('/payment', { state: { consultationFee, doctor } });
  };

  return (
    <div className="confirm-booking-wrapper">
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <button onClick={handleConfirm} className="confirm-booking-btn">Confirm Booking →</button>
      </div>
    </div>
  );
};

export default BookingConfirm;