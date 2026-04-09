import { Route } from "react-router-dom";
import PatientDashboard from "../pages/Patient/PatientDashboard";
import PatientProfile from "../pages/Patient/PatientProfile";
import PatientMedicalReports from "../pages/Patient/PatientMedicalReports";

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
];

export default patientRoutes;