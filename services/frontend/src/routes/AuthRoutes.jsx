import { Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import PatientRegister from "../pages/Auth/PatientRegister";

const authRoutes = [
  <Route key="root-home" path="/" element={<Home />} />,
  <Route key="home" path="/home" element={<Home />} />,
  <Route key="login" path="/login" element={<Login />} />,
  <Route key="register" path="/register" element={<Register />} />,
  <Route
    key="register-patient"
    path="/register/patient"
    element={<PatientRegister />}
  />,
];

export default authRoutes;