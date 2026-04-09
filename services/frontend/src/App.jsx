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
>>>>>>> 755ea2fc2158e21e29974fce679bc46e2d38e72b
      </Routes>
    </Router>
  );
}

export default App;
