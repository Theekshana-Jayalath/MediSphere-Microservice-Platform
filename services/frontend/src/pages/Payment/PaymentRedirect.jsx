import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/payment.css";

const PaymentRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [appointmentUpdated, setAppointmentUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('order_id');
    const statusCode = params.get('status_code');

    console.log("🔵 Payment redirect params:", { orderId, statusCode });

    // Get pending appointment ID from localStorage
    const pendingAppointmentId = localStorage.getItem('pendingAppointmentId');
    const appointmentData = JSON.parse(localStorage.getItem('appointmentData') || '{}');
    
    console.log("📋 Pending appointment:", { pendingAppointmentId, appointmentData });

    const updateAppointmentStatus = async () => {
      if (statusCode === '2' && pendingAppointmentId) {
        // Payment successful - update appointment status
        setPaymentStatus('success');
        
        try {
          console.log("💰 Updating appointment status for:", pendingAppointmentId);
          
          // Call backend to update appointment status
          const response = await fetch(`http://localhost:5003/api/appointments/payment/success/${pendingAppointmentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderId,
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
              paidAt: new Date().toISOString()
            })
          });

          const data = await response.json();
          console.log("✅ Appointment update response:", data);

          if (response.ok) {
            setAppointmentUpdated(true);
            
            // Clear pending data from localStorage
            localStorage.removeItem('pendingAppointmentId');
            localStorage.removeItem('appointmentData');
            
            // Store confirmed appointment for receipt page
            localStorage.setItem('lastConfirmedAppointment', JSON.stringify(data));
            
            console.log("✅ Appointment successfully updated to PAID and CONFIRMED");
          } else {
            console.error("❌ Failed to update appointment:", data);
            
            // Try alternative update endpoint
            await tryAlternativeUpdate(pendingAppointmentId, orderId);
          }
          
        } catch (error) {
          console.error("❌ Error updating appointment:", error);
          
          // Try alternative method
          await tryAlternativeUpdate(pendingAppointmentId, orderId);
        }
        
      } else if (statusCode === '0' || statusCode === '-1' || statusCode === '-2' || statusCode === '-3') {
        // Payment failed or cancelled
        setPaymentStatus('failed');
        console.log("❌ Payment failed with status code:", statusCode);
        
        // Keep appointment as PENDING, but mark payment failed
        if (pendingAppointmentId) {
          try {
            await fetch(`http://localhost:5003/api/appointments/payment/failed/${pendingAppointmentId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: orderId,
                paymentStatus: 'FAILED',
                statusCode: statusCode
              })
            });
          } catch (error) {
            console.error("Error marking payment as failed:", error);
          }
        }
      } else {
        setPaymentStatus('unknown');
        console.warn("⚠️ Unknown payment status code:", statusCode);
      }
    };

    const tryAlternativeUpdate = async (appointmentId, orderId) => {
      try {
        console.log("🔄 Trying alternative update method...");
        
        const response = await fetch(`http://localhost:5003/api/appointments/update-payment-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: appointmentId,
            orderId: orderId,
            paymentStatus: 'PAID',
            status: 'CONFIRMED'
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          setAppointmentUpdated(true);
          localStorage.removeItem('pendingAppointmentId');
          localStorage.removeItem('appointmentData');
          localStorage.setItem('lastConfirmedAppointment', JSON.stringify(data.appointment));
          console.log("✅ Appointment updated via alternative method");
        } else {
          setErrorMessage('Payment received but unable to update appointment. Please contact support.');
        }
      } catch (error) {
        console.error("❌ Alternative update failed:", error);
        setErrorMessage('Payment received but unable to update appointment. Please contact support with Order ID: ' + orderId);
      }
    };

    // Execute the update
    updateAppointmentStatus();

    // Countdown timer for redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect based on payment status
          if (statusCode === '2') {
            navigate('/appointments', { 
              replace: true,
              state: { 
                paymentSuccess: true,
                appointmentUpdated: appointmentUpdated 
              }
            });
          } else {
            navigate('/appointment', { replace: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  const params = new URLSearchParams(location.search);
  const isSuccess = params.get('status_code') === '2';
  const orderId = params.get('order_id');

  return (
    <div className="payment-redirect-container">
      <div className="payment-redirect-card">
        <div className={`redirect-icon ${isSuccess ? 'success' : 'error'}`}>
          {paymentStatus === 'processing' && (
            <div className="spinner-small"></div>
          )}
          {paymentStatus === 'success' && '✓'}
          {paymentStatus === 'failed' && '✗'}
          {paymentStatus === 'unknown' && '⚠'}
        </div>
        
        <h1 className="redirect-title">
          {paymentStatus === 'processing' && 'Processing Payment...'}
          {paymentStatus === 'success' && 'Payment Successful!'}
          {paymentStatus === 'failed' && 'Payment Failed'}
          {paymentStatus === 'unknown' && 'Payment Status Unknown'}
        </h1>
        
        <p className="redirect-message">
          {paymentStatus === 'processing' && 'Verifying your payment...'}
          {paymentStatus === 'success' && (
            appointmentUpdated 
              ? 'Your appointment has been confirmed successfully.' 
              : 'Payment successful! Updating your appointment...'
          )}
          {paymentStatus === 'failed' && 'Payment was not successful. Please try again.'}
          {paymentStatus === 'unknown' && 'We couldn\'t verify your payment status. Please check your email for confirmation.'}
          {errorMessage && (
            <span className="error-detail">{errorMessage}</span>
          )}
        </p>
        
        {orderId && (
          <p className="order-reference">
            Order Reference: <span>{orderId}</span>
          </p>
        )}
        
        <p className="redirect-countdown">
          Redirecting in {countdown} seconds...
        </p>
        
        <div className="redirect-actions">
          <button 
            onClick={() => {
              if (isSuccess) {
                navigate('/appointments', { 
                  state: { paymentSuccess: true } 
                });
              } else {
                navigate('/appointment');
              }
            }}
            className="redirect-button primary"
          >
            {isSuccess ? 'View My Appointments' : 'Try Again'}
          </button>
          
          {isSuccess && (
            <button 
              onClick={() => navigate('/')}
              className="redirect-button secondary"
            >
              Go to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentRedirect;