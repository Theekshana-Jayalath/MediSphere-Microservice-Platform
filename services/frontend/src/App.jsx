import { BrowserRouter as Router, Routes } from "react-router-dom";
import appointmentRoutes from "./routes/AppointmentRoutes.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {appointmentRoutes}
      </Routes>
    </Router>
  );
}

export default App;