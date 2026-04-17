// In your appointmentRoutes.js file
import { Route } from "react-router-dom";
import Appointment from "../pages/Appointment/Appointment.jsx";
import BookingPage from "../pages/Appointment/BookingPage.jsx";
import PaymentPage from "../pages/Payment/PaymentPage.jsx";
import PaymentRedirect from "../pages/Payment/PaymentRedirect.jsx"; // Create this component
import PaymentSuccess from "../pages/Payment/PaymentSuccess.jsx";

// Export as a fragment with Routes instead of an array
const appointmentRoutes = (
  <>
    <Route key="appointment-root" path="/appointment" element={<Appointment />} />
    <Route key="appointment-booking" path="/appointment/booking" element={<BookingPage />} />
    <Route key="appointment-payment" path="/payment" element={<PaymentPage />} />
  {/* Add routes for PayHere redirects */}
  <Route key="payment-redirect" path="/payment-redirect" element={<PaymentSuccess />} />
  <Route key="payment-success" path="/payment-success" element={<PaymentRedirect />} />
  <Route key="payment-cancel" path="/payment-cancel" element={<PaymentRedirect />} />
  </>
);

export default appointmentRoutes;