import { Route } from "react-router-dom";
import Appointment from "../pages/Appointment/Appointment.jsx";
import BookingPage from "../pages/Appointment/BookingPage.jsx";
import PaymentPage from "../pages/Payment/PaymentPage.jsx";

// Export an array of <Route/> elements so they can be passed directly
// as children to <Routes> (Routes expects Route elements as direct children).
const appointmentRoutes = [
  <Route key="appointment-root" path="/" element={<Appointment />} />,
  <Route key="appointment-booking" path="/booking" element={<BookingPage />} />,
  <Route key="appointment-payment" path="/payment" element={<PaymentPage />} />,
];

export default appointmentRoutes;