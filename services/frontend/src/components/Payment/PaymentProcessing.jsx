import React from "react";

const PaymentProcessing = ({ status, amount }) => {
  return (
    <div className="processing-container">
      <div className="processing-card">
        <div className={`processing-icon ${status}`}>
          {status === "processing" && <div className="spinner"></div>}
          {status === "success" && <div className="checkmark">✓</div>}
        </div>

        <h2 className="processing-title">
          {status === "processing" ? "Processing Your Payment..." : "Payment Successful!"}
        </h2>

        <p className="processing-message">
          {status === "processing"
            ? "Please do not refresh the page while we finalize your transaction."
            : "Your appointment has been confirmed successfully."}
        </p>

        <div className="payment-details-box">
          <span className="service-name">Consultation Appointment</span>
          <span className="payment-amount">LKR {amount?.toFixed(2) || "500.00"}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;