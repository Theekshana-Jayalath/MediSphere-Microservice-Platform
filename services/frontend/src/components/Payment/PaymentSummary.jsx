import React from "react";

const PaymentSummary = ({ consultationFee = 0 }) => {
  const fee = Number(consultationFee) || 0;
  const serviceCharge = 500;
  const tax = (fee * 0.04);
  const total = fee + serviceCharge + tax;

  return (
    <div className="payment-summary-card">
      <div className="summary-header">
        <div>
          <p className="summary-label">TOTAL AMOUNT</p>
          <h2 className="summary-amount">LKR {total.toFixed(2)}</h2>
        </div>
        <span className="verified-badge">✓ VERIFIED RATE</span>
      </div>
      <div className="summary-divider"></div>
      <div className="summary-row"><span>Consultation Fee</span><span>LKR {fee.toFixed(2)}</span></div>
      <div className="summary-row"><span>Service Charge</span><span>LKR {serviceCharge.toFixed(2)}</span></div>
      <div className="summary-row"><span>Healthcare Tax (4%)</span><span>LKR {tax.toFixed(2)}</span></div>
    </div>
  );
};

export default PaymentSummary;