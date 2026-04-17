import { Route } from "react-router-dom";
import PatientDashboard from "../pages/Patient/PatientDashboard";
import PatientProfile from "../pages/Patient/PatientProfile";
import PatientMedicalReports from "../pages/Patient/PatientMedicalReports";
import PatientAppointments from "../pages/Patient/PatientAppointments";
import PatientPayments from "../pages/Patient/PatientPayments";
import PatientPrescriptions from "../pages/Patient/PatientPrescriptions";
import PatientSessions from "../pages/Patient/PatientSessions";

const patientRoutes = [
  <Route
    key="patient-dashboard"
    path="/patient/dashboard"
    element={<PatientDashboard />}
  />,
  <Route
    key="patient-profile"
    path="/patient/profile"
    element={<PatientProfile />}
  />,
  <Route
    key="patient-medical-reports"
    path="/patient/medical-reports"
    element={<PatientMedicalReports />}
  />,
  <Route
    key="patient-appointments"
    path="/patient/appointments"
    element={<PatientAppointments />}
  />,
  <Route
    key="patient-payments"
    path="/patient/payments"
    element={<PatientPayments />}
  />,
  <Route
    key="patient-prescriptions"
    path="/patient/prescriptions"
    element={<PatientPrescriptions />}
  />,
  <Route
    key="patient-sessions"
    path="/patient/sessions"
    element={<PatientSessions />}
  />,
];

export default patientRoutes;