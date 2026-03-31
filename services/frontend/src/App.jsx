import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Appointment from "./pages/Appointment/Appointment.jsx";
import BookingPage from "./pages/Appointment/BookingPage.jsx";
import PaymentPage from './pages/Payment/PaymentPage.jsx';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Appointment />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/payment" element={<PaymentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;