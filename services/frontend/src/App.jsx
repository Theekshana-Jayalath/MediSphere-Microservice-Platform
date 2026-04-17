import { BrowserRouter as Router, Routes } from "react-router-dom";
import appointmentRoutes from "./routes/AppointmentRoutes.jsx";
import authRoutes from "./routes/AuthRoutes.jsx";
import patientRoutes from "./routes/PatientRoutes.jsx";
import adminRoutes from "./routes/AdminRoutes.jsx";
import doctorRoutes from "./routes/DoctorRoutes.jsx";


function App() {
  return (
    <Router>
      <Routes>
        {authRoutes}
        {patientRoutes}
        {doctorRoutes}
        {adminRoutes}
        {appointmentRoutes}
      </Routes>
    </Router>
  );
}

export default App;
