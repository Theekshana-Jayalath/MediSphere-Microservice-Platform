import { useState } from "react";
import PaymentSummary from "../../components/Payment/PaymentSummary";
import PayHereSection from "../../components/Payment/PayHereSection";
import CardPopup from "../../components/Payment/CardPopup";
import WalletPopup from "../../components/Payment/WalletPopup";
import { useLocation } from "react-router-dom";

const PaymentPage = () => {
  const [popup, setPopup] = useState(null);
  const location = useLocation();
  const consultationFee = Number(location.state?.consultationFee ?? 0);

  // Handle method selection (from PayHereSection)
  const handleSelectMethod = (method) => {
    setPopup(method);
  };

  // Close popup
  const handleClosePopup = () => {
    setPopup(null);
  };

  // Determine wallet type safely
  const isWallet = popup === "frimi" || popup === "genie";

  return (
    <div className="pm-page">

      {/* Header */}
      <div className="pm-header">
        <h1>Secure Payment</h1>
        <p>Finalize your booking with our specialist.</p>
      </div>

      {/* Main Content */}
      <div className="pm-wrapper">

  <PaymentSummary consultationFee={consultationFee} />

        <PayHereSection onSelectMethod={handleSelectMethod} />

        <button className="ms-btn-primary pm-main-btn">
            Pay →
        </button>

      </div>

      {/* ================= POPUPS ================= */}

      {/* Card Popup (Visa / Mastercard) */}
      <CardPopup
        open={popup === "card"}
        onClose={handleClosePopup}
      />

      {/* Wallet Popup (FriMi / Genie) */}
      <WalletPopup
        open={isWallet}
        type={popup}   // "frimi" or "genie"
        onClose={handleClosePopup}
      />

    </div>
  );
};

export default PaymentPage;