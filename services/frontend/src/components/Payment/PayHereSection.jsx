import { useState } from "react";

const PayHereSection = ({ onSelectMethod }) => {
  const [quickPay, setQuickPay] = useState(false);

  return (
    <div className="pm-payhere-card">

      {/* Header */}
      <div className="pm-payhere-header">
        <h3>
          <span className="pm-logo">PayHere</span>
        </h3>

        <span className="pm-secure">● SECURE</span>
      </div>

      {/* Input */}
      <label className="pm-input-label">
        Mobile Number or Email
      </label>

      <div className="pm-input-wrap">
        <input
          type="text"
          placeholder="e.g. +1 234 567 890"
        />
        <span>🔍</span>
      </div>

      {/* Payment Methods */}
      <div className="pm-methods">
        <p>Available Payment Modes</p>

        <div className="pm-method-icons">
          <span onClick={() => onSelectMethod("card")}>
            VISA
          </span>

          <span onClick={() => onSelectMethod("card")}>
            Mastercard
          </span>

          <span onClick={() => onSelectMethod("frimi")}>
            FriMi
          </span>

          <span onClick={() => onSelectMethod("genie")}>
            Genie
          </span>
        </div>
      </div>

      {/* Toggle */}
      <div className="pm-toggle-row">
        <div
          className={`pm-toggle ${quickPay ? "active" : ""}`}
          onClick={() => setQuickPay(!quickPay)}
        >
          <div></div>
        </div>

        <span> Remember me for Quick Pay</span>

        <span className="pm-lightning">⚡</span>
      </div>

    </div>
  );
};

export default PayHereSection;