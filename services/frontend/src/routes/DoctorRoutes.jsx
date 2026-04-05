// DoctorRoutes.jsx
import React from "react";
import { Route } from "react-router-dom";
import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import MySchedule from "../pages/doctor/MySchedule";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import DoctorAvailability from "../pages/doctor/DoctorAvailability";
import DoctorReports from "../pages/doctor/DoctorReports";
import DoctorTelemedicine from "../pages/doctor/DoctorTelemedicine";
import DoctorCreatePrescription from "../pages/doctor/DoctorCreatePrescription";
import DoctorPrescriptions from "../pages/doctor/DoctorPrescriptions";

const DoctorRoutes = () => {
  return (
    <>
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/doctor/schedule" element={<MySchedule />} />
      <Route path="/doctor/appointments" element={<DoctorAppointments />} />
      <Route path="/doctor/availability" element={<DoctorAvailability />} />
      <Route path="/doctor/reports" element={<DoctorReports />} />
      <Route path="/doctor/telemedicine" element={<DoctorTelemedicine />} />
      <Route path="/doctor/create-prescription" element={<DoctorCreatePrescription />} />
      <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
    </>
  );
};

export default DoctorRoutes;