import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorAvailability from "./pages/doctor/DoctorAvailability";
import DoctorReports from "./pages/doctor/DoctorReports";
import DoctorTelemedicine from "./pages/doctor/DoctorTelemedicine";
import DoctorCreatePrescription from "./pages/doctor/DoctorCreatePrescription";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";
import MySchedule from "./pages/doctor/MySchedule";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/schedule" element={<MySchedule />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/availability" element={<DoctorAvailability />} />
        <Route path="/doctor/reports" element={<DoctorReports />} />
        <Route path="/doctor/telemedicine" element={<DoctorTelemedicine />} />
        <Route path="/doctor/create-prescription" element={<DoctorCreatePrescription />} />
        <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
      </Routes>
    </Router>
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