import React from "react";
import { Route } from "react-router-dom";
import DoctorRegisterPage from "../pages/doctor/DoctorRegisterPage.jsx";
import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import MySchedule from "../pages/doctor/MySchedule";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import DoctorAvailability from "../pages/doctor/DoctorAvailability";
import DoctorReports from "../pages/doctor/DoctorReports";
import DoctorTelemedicine from "../pages/doctor/DoctorTelemedicine";
import DoctorCreatePrescription from "../pages/doctor/DoctorCreatePrescription";
import DoctorPrescriptions from "../pages/doctor/DoctorPrescriptions";

let doctorRoutes = [
  <Route
    key="doctor-register"
    path="/doctor/register"
    element={<DoctorRegisterPage />}
  />,
  <Route
    key="doctor-dashboard"
    path="/doctor/dashboard"
    element={<DoctorDashboard />}
  />,
  <Route
    key="doctor-schedule"
    path="/doctor/schedule"
    element={<MySchedule />}
  />,
  <Route
    key="doctor-appointments"
    path="/doctor/appointments"
    element={<DoctorAppointments />}
  />,
  <Route
    key="doctor-availability"
    path="/doctor/availability"
    element={<DoctorAvailability />}
  />,
  <Route
    key="doctor-reports"
    path="/doctor/reports"
    element={<DoctorReports />}
  />,
  <Route
    key="doctor-telemedicine"
    path="/doctor/telemedicine"
    element={<DoctorTelemedicine />}
  />,
  <Route
    key="doctor-create-prescription"
    path="/doctor/create-prescription"
    element={<DoctorCreatePrescription />}
  />,
  <Route
    key="doctor-prescriptions"
    path="/doctor/prescriptions"
    element={<DoctorPrescriptions />}
  />,
];

export default doctorRoutes;