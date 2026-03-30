export const doctorProfile = {
  id: "DOC001",
  name: "Dr. Vane Julian",
  specialty: "Chief Cardiologist",
  email: "dr.vane@medisphere.com",
  hospital: "MediSphere Clinic",
};

export const todayAppointments = [
  {
    id: "APT001",
    time: "09:00 AM",
    patientName: "Eleanor Fitzgerald",
    type: "In-Person",
    reason: "Follow-up: Hypertension Management",
    status: "confirmed",
  },
  {
    id: "APT002",
    time: "10:30 AM",
    patientName: "Marcus Thorne",
    type: "Video Call",
    reason: "Telehealth: Chest Pain Inquiry",
    status: "join-now",
  },
  {
    id: "APT003",
    time: "11:45 AM",
    patientName: "Sarah Jenkins",
    type: "In-Person",
    reason: "Initial Consultation: Arrhythmia",
    status: "confirmed",
  },
];

export const pendingRequests = [
  {
    id: "REQ001",
    patientName: "Linda Wu",
    requestTime: "Tomorrow, 2:00 PM",
    note: "Patient reports recurring shortness of breath during light exercise.",
  },
  {
    id: "REQ002",
    patientName: "Kevin Miller",
    requestTime: "Wed, 10:00 AM",
    note: "Routine medication review and blood pressure check-up. Stable for 6 months.",
  },
];

export const availabilitySlots = [
  {
    id: "SLOT001",
    time: "08:00 - 12:00",
    hospital: "MediSphere Main Clinic",
    location: "Downtown, New York",
    department: "Cardiology",
    capacity: 6,
    booked: 3,
    type: "In-Person",
  },
  {
    id: "SLOT002",
    time: "14:00 - 18:00",
    hospital: "MediSphere Electronic Health",
    location: "Virtual/Online",
    department: "Telemedicine",
    capacity: 10,
    booked: 5,
    type: "Video Call",
  },
];

export const dashboardStats = {
  patientsToday: 24,
  waitTime: "12m",
  sessionsToday: 8,
};

export const aiInsight = {
  message:
    "Statistics show a 15% increase in respiratory complaints this week. Consider preparing extra diagnostic slots for Thursday.",
};