import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorAvailability from "./pages/doctor/DoctorAvailability";
import DoctorReports from "./pages/doctor/DoctorReports";
import DoctorTelemedicine from "./pages/doctor/DoctorTelemedicine";
import DoctorCreatePrescription from "./pages/doctor/DoctorCreatePrescription";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";
import MySchedule from "./pages/doctor/MySchedule";

import Appointment from "./pages/Appointment/Appointment.jsx";
import BookingPage from "./pages/Appointment/BookingPage.jsx";
import PaymentPage from "./pages/Payment/PaymentPage.jsx";
import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import PatientRegister from "./pages/Auth/PatientRegister";
import PatientDashboard from "./pages/Patient/PatientDashboard";
import PatientProfile from "./pages/Patient/PatientProfile";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Home Page */}
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/patient" element={<PatientRegister />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/profile" element={<PatientProfile />} />

        {/* Existing root redirect logic */}
        <Route path="/" element={<Navigate to="/doctor/dashboard" replace />} />

        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/schedule" element={<MySchedule />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/availability" element={<DoctorAvailability />} />
        <Route path="/doctor/reports" element={<DoctorReports />} />
        <Route path="/doctor/telemedicine" element={<DoctorTelemedicine />} />
        <Route
          path="/doctor/create-prescription"
          element={<DoctorCreatePrescription />}
        />
        <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />

        {/* Appointment / Payment Routes */}
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/payment" element={<PaymentPage />} />
      </Routes>
    </Router>
  );
}

export default App;