import { useState, useEffect } from "react";
import PaymentSummary from "../../components/Payment/PaymentSummary";
import PayHereSection from "../../components/Payment/PayHereSection";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/payment.css";

const PaymentPage = () => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contact, setContact] = useState("");
  const [payHereReady, setPayHereReady] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const bookingDetails = location.state?.bookingDetails;
  const consultationFee =
    bookingDetails?.consultationFee ||
    bookingDetails?.doctor?.raw?.consultationFee ||
    bookingDetails?.doctor?.consultationFee ||
    500;

  // Check if PayHere is loaded and setup event handlers
  useEffect(() => {
    const checkPayHere = setInterval(() => {
      if (window.payhere) {
        console.log('✅ PayHere loaded successfully');
        
        // Setup event handlers BEFORE any payment
        window.payhere.onCompleted = function onCompleted(orderId) {
          console.log("✅ Payment completed. OrderID:", orderId);
          setIsProcessing(false);
          // Redirect to success page with order_id
          window.location.href = `/payment-redirect?order_id=${orderId}&status_code=2`;
        };

        window.payhere.onDismissed = function onDismissed() {
          console.log("❌ Payment dismissed by user");
          setIsProcessing(false);
          alert("Payment was cancelled. Please try again.");
        };

        window.payhere.onError = function onError(error) {
          console.log("⚠️ PayHere error:", error);
          setIsProcessing(false);
          alert("Payment gateway error: " + JSON.stringify(error));
        };
        
        setPayHereReady(true);
        clearInterval(checkPayHere);
      } else {
        console.log('⏳ Waiting for PayHere to load...');
      }
    }, 500);

    setTimeout(() => {
      clearInterval(checkPayHere);
      if (!window.payhere) {
        console.error('❌ PayHere failed to load');
        alert('Payment gateway failed to load. Please refresh the page.');
      }
    }, 10000);

    return () => clearInterval(checkPayHere);
  }, []);

  const handleSelectMethod = (method) => {
    setSelectedMethod((cur) => (cur === method ? null : method));
  };

  const handlePay = async () => {
    console.log("🔵 Starting payment process...");
    
    if (!selectedMethod) {
      alert("Please select a payment method");
      return;
    }

    if (!contact || contact.trim() === "") {
      alert("Please enter mobile number or email");
      return;
    }

    const isEmail = /\S+@\S+\.\S+/.test(contact);
    const isPhone = /^(\+?[0-9\s-]{7,20})$/.test(contact);

    if (!isEmail && !isPhone) {
      alert("Please enter a valid mobile number or email.");
      return;
    }

    if (!payHereReady) {
      alert("Payment gateway is still loading. Please wait.");
      return;
    }

    setIsProcessing(true);

    try {
      const patientId = localStorage.getItem("patientId") || "temp_patient_" + Date.now();
      
      const requestBody = {
        appointmentId: "APT_" + Date.now(),
        patientId: patientId,
        doctorId: bookingDetails?.doctor?.id || bookingDetails?.doctor?._id,
        amount: consultationFee,
        contact: contact,
        bookingDetails: {
          doctor: bookingDetails?.doctor,
          selectedDate: bookingDetails?.selectedDate,
          selectedTime: bookingDetails?.selectedTime,
          selectedConsultation: bookingDetails?.selectedConsultation,
        }
      };

      console.log("📤 Sending to backend:", requestBody);

      const response = await fetch("http://localhost:5003/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("📥 Backend response:", data);

      if (data.success && data.payhere) {
        console.log("🚀 Opening PayHere payment window...");
        
        // According to PayHere official documentation
        // For popup mode, return_url and cancel_url can be undefined
        const payment = {
          sandbox: true,
          merchant_id: data.payhere.merchant_id,
          return_url: undefined,  // Important: undefined for popup mode
          cancel_url: undefined,  // Important: undefined for popup mode
          notify_url: data.payhere.notify_url,
          order_id: data.payhere.order_id,
          items: data.payhere.items,
          amount: data.payhere.amount,
          currency: data.payhere.currency,
          hash: data.payhere.hash,
          first_name: data.payhere.first_name,
          last_name: data.payhere.last_name,
          email: data.payhere.email,
          phone: data.payhere.phone,
          address: data.payhere.address,
          city: data.payhere.city,
          country: data.payhere.country,
          custom_1: data.payhere.custom_1,
          custom_2: data.payhere.custom_2
        };
        
        console.log("Payment object:", payment);
        
        // Verify payhere.startPayment exists
        if (typeof window.payhere.startPayment !== 'function') {
          throw new Error('PayHere startPayment is not a function');
        }
        
        // Start the payment popup
        window.payhere.startPayment(payment);
        
        // Don't set isProcessing false here - wait for onCompleted or onError
      } else {
        throw new Error(data.message || "Failed to create payment");
      }
    } catch (error) {
      console.error("❌ Payment error:", error);
      alert("Payment failed: " + error.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1 className="payment-title">Secure Payment</h1>
          <p className="payment-subtitle">
            Finalize your booking with our specialist.
          </p>
        </div>

        <div className="payment-grid">
          <PaymentSummary consultationFee={consultationFee} />
          <PayHereSection
            onSelectMethod={handleSelectMethod}
            selectedMethod={selectedMethod}
            contact={contact}
            onContactChange={setContact}
            onProcessPayment={handlePay}
            isProcessing={isProcessing}
            payHereReady={payHereReady}
          />
        </div>

        {isProcessing && (
          <div className="payment-overlay">
            <div className="payment-modal">
              <div className="processing-container">
                <div className="processing-icon processing">
                  <div className="spinner"></div>
                </div>
                <h2 className="processing-title">
                  Redirecting to Payment Gateway...
                </h2>
                <p className="processing-message">
                  Please wait while we redirect you to PayHere secure payment
                  page.
                </p>
                <button 
                  onClick={() => setIsProcessing(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;