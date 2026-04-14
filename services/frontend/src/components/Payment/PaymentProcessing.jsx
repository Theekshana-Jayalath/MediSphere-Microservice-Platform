import React from "react";
import "../../styles/payment.css";

const PaymentProcessing = ({ status }) => {
  return (
    <div className="processing-container">
      <div className="processing-card">
        
        <div className={`icon-circle ${status}`}>
          {status === "processing" && <div className="spinner"></div>}
          {status === "success" && <div className="checkmark">✓</div>}
        </div>

        <h2>
          {status === "processing"
            ? "Processing Your Secure Payment..."
            : "Payment Successful"}
        </h2>

        <p>
          {status === "processing"
            ? "Please do not refresh the page while we finalize your transaction."
            : "Your appointment has been confirmed successfully."}
        </p>

        <div className="service-box">
          <span>Appointment with Dr. Julian Henderson</span>
          <span className="amount">LKR 4,975.00</span>
        </div>

      </div>
    </div>
  );
};

export default PaymentProcessing;