import React from "react";

const BookingConfirm = () => {
  return (
    <div className="confirm-booking-wrapper">
      <div className="insurance-info">
        <div style={{ fontWeight: 600 }}>✔ Insurance accepted</div>
        <div style={{ fontSize: 13, color: 'var(--ms-mid)' }}>Estimated co-pay will be shown on next step</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <button className="confirm-booking-btn">Confirm Booking →</button>
      </div>
    </div>
  );
};

export default BookingConfirm;