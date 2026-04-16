// In your appointmentRoutes.js file
import Appointment from "../pages/Appointment/Appointment.jsx";
import BookingPage from "../pages/Appointment/BookingPage.jsx";
import PaymentPage from "../pages/Payment/PaymentPage.jsx";

// Export as a fragment with Routes instead of an array
const appointmentRoutes = (
  <>
    <Route key="appointment-root" path="/appointment" element={<Appointment />} />
    <Route key="appointment-booking" path="/appointment/booking" element={<BookingPage />} />
    <Route key="appointment-payment" path="/payment" element={<PaymentPage />} />
  </>
);

export default appointmentRoutes;