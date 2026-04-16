import { Route } from "react-router-dom";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminPatients from "../pages/Admin/AdminPatients";
import AdminDoctorVerification from "../pages/Admin/AdminVerifyAccounts";
import AdminDoctors from "../pages/Admin/AdminDoctors";
import AdminPayments from "../pages/Admin/AdminPayments";
import AdminAppointments from "../pages/Admin/AdminAppointments";

const adminRoutes = [
  <Route
    key="admin-dashboard"
    path="/admin/dashboard"
    element={<AdminDashboard />}
  />,
  <Route
    key="admin-patients"
    path="/admin/patients"
    element={<AdminPatients />}
  />,
  <Route
    key="admin-verify"
    path="/admin/verify"
    element={<AdminDoctorVerification />}
  />,
  <Route
    key="admin-doctors"
    path="/admin/doctors"
    element={<AdminDoctors />}
  />,
  <Route
    key="admin-payments"
    path="/admin/payments"
    element={<AdminPayments />}
  />,
  <Route
    key="admin-appointments"
    path="/admin/appointments"
    element={<AdminAppointments />}
  />,
];

export default adminRoutes;