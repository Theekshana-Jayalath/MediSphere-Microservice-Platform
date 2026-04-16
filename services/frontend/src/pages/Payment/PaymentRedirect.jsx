import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/payment.css";

const PaymentRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('order_id');
    const statusCode = params.get('status_code');

    console.log("Payment redirect params:", { orderId, statusCode });

    // status_code: 2 = success, 0 = pending, -1 = cancelled, -2 = failed, -3 = charged back
    const isSuccess = statusCode === '2';
    
    setPaymentStatus(isSuccess ? 'success' : 'failed');

    if (isSuccess && orderId) {
      // Verify payment with backend
      verifyPayment(orderId);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/appointment', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  const verifyPayment = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5003/api/payments/status/${orderId}`);
      const data = await response.json();
      console.log("Payment verification:", data);
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  const params = new URLSearchParams(location.search);
  const isSuccess = params.get('status_code') === '2';

  return (
    <div className="payment-redirect-container">
      <div className="payment-redirect-card">
        <div className={`redirect-icon ${isSuccess ? 'success' : 'error'}`}>
          {isSuccess ? '✓' : '✗'}
        </div>
        
        <h1 className="redirect-title">
          {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
        </h1>
        
        <p className="redirect-message">
          {isSuccess 
            ? 'Your appointment has been confirmed successfully.' 
            : 'Payment was not successful. Please try again.'}
        </p>
        
        <p className="redirect-countdown">
          Redirecting to appointment page in {countdown} seconds...
        </p>
        
        <button 
          onClick={() => navigate('/appointment')}
          className="redirect-button"
        >
          Go to Appointment Page Now
        </button>
      </div>
    </div>
  );
};

export default PaymentRedirect;