import { BrowserRouter as Router, Routes } from "react-router-dom";
import appointmentRoutes from "./routes/AppointmentRoutes.jsx";
import authRoutes from "./routes/AuthRoutes.jsx";
import patientRoutes from "./routes/PatientRoutes.jsx";
import adminRoutes from "./routes/AdminRoutes.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {appointmentRoutes}
        {authRoutes}
        {patientRoutes}
        {adminRoutes}
        {appointmentRoutes}
      </Routes>
    </Router>
  );
}

export default App;