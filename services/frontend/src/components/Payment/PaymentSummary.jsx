const PaymentSummary = ({ consultationFee = 0 }) => {
  // Ensure numeric
  const fee = Number(consultationFee) || 0;
  const serviceCharge = 500; // fixed LKR per doctor
  const tax = Math.round((fee * 0.04) * 100) / 100; // 4% of consultation fee, rounded to 2 decimals
  const total = Math.round((fee + serviceCharge + tax) * 100) / 100;

  const fmt = (val) => `LKR ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="pm-summary-card">

      <div className="pm-summary-top">
        <div>
          <p className="pm-label">TOTAL AMOUNT</p>
          <h2>{fmt(total)}</h2>
        </div>

        <span className="pm-verified">✔ VERIFIED RATE</span>
      </div>

      <div className="pm-divider"></div>

      <div className="pm-row">
        <span>Consultation Fee</span>
        <span>{fmt(fee)}</span>
      </div>

      <div className="pm-row">
        <span>Service Charge</span>
        <span>{fmt(serviceCharge)}</span>
      </div>

      <div className="pm-row">
        <span>Healthcare Tax (4%)</span>
        <span>{fmt(tax)}</span>
      </div>

    </div>
  );
};

export default PaymentSummary;