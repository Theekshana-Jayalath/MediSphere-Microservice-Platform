import { useState, useEffect } from "react";
import PaymentSummary from "../../components/Payment/PaymentSummary";
import PayHereSection from "../../components/Payment/PayHereSection";
import PaymentProcessing from "../../components/Payment/PaymentProcessing";
import { useLocation } from "react-router-dom";
import "../../styles/payment.css";

const PaymentPage = () => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | processing | success | failed
  const [contact, setContact] = useState("");

  const location = useLocation();
  const consultationFee = Number(location.state?.consultationFee ?? 0);

  // ✅ PayHere event handlers
  useEffect(() => {

    if (!window.payhere) return;

    window.payhere.onCompleted = function (orderId) {
      console.log("Payment completed:", orderId);
      setStatus("success");
    };

    window.payhere.onDismissed = function () {
      console.log("Payment dismissed");
      setStatus("idle");
    };

    window.payhere.onError = function (error) {
      console.log("Payment error:", error);
      setStatus("failed");
    };

  }, []);

  const handleSelectMethod = (method) => {
    setSelectedMethod((cur) => (cur === method ? null : method));
  };

  const handlePay = async () => {
    if (!selectedMethod) {
      alert("Please select a payment method");
      return;
    }

    const isEmail = /\S+@\S+\.\S+/.test(contact);
    const isPhone = /^(\+?[0-9\s-]{7,20})$/.test(contact);

    if (!isEmail && !isPhone) {
      alert("Please enter a valid mobile number or email.");
      return;
    }

    try {
      setStatus("processing"); // show processing UI

      const response = await fetch("http://localhost:5003/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId: "12345",
          patientId: "p001",
          doctorId: "d001",
          amount: consultationFee || 1500,
          contact,
        }),
      });

      const data = await response.json();

      console.log("PayHere Data:", data);

      window.payhere.startPayment(data.payhere);

    } catch (error) {
      console.error(error);
      setStatus("failed");
    }
  };

  // Don't unmount form on processing/success — show processing as an overlay
  const showProcessingOverlay = status === "processing" || status === "success";

  return (
    <div className="pm-page">

      <div className="pm-header">
        <h1>Secure Payment</h1>
        <p>Finalize your booking with our specialist.</p>
      </div>

      <div className="pm-wrapper">

        <PaymentSummary consultationFee={consultationFee} />

        <PayHereSection
          onSelectMethod={handleSelectMethod}
          selectedMethod={selectedMethod}
          contact={contact}
          onContactChange={setContact}
          onProcessPayment={handlePay}
        />

        <button
          onClick={handlePay}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          disabled={
            !selectedMethod ||
            !(contact &&
              (/\S+@\S+\.\S+/.test(contact) ||
                /^(\+?[0-9\s-]{7,20})$/.test(contact)))
          }
        >
          Pay Now
        </button>

        {showProcessingOverlay && (
          <div className="pm-modal-overlay">
            <div className="pm-modal">
              <PaymentProcessing status={status} amount={consultationFee} />
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default PaymentPage;