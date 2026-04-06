import { Route } from "react-router-dom";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminPatients from "../pages/Admin/AdminPatients";

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
];

export default adminRoutes;