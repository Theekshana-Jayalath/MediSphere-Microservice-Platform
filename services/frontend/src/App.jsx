import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Appointment from "./pages/Appointment/Appointment.jsx";
import BookingPage from "./pages/Appointment/BookingPage.jsx";
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Appointment />} />
        <Route path="/booking" element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;