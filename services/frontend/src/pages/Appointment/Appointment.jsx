import React, { useState, useEffect } from "react";
import FilterSidebar from "../../components/Appointment/FilterSidebar.jsx";
import TopSearch from "../../components/Appointment/TopSearch.jsx";
import DoctorCard from "../../components/Appointment/DoctorCard.jsx";
import "../../styles/appointment.css";
import axios from "axios";

const Appointment = () => {
  const [search, setSearch] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("All Hospitals");
  // Use per-patient session key so date selection is not shared between different logins
  const currentPatientId = localStorage.getItem('patientId') || '';
  const storageKeyBase = 'appointmentSelectedDate';
  const storageKey = currentPatientId ? `${storageKeyBase}_${currentPatientId}` : storageKeyBase;

  const [selectedDate, setSelectedDate] = useState(() => {
    // Read saved date but clear it if this page load is a full reload/navigation (not SPA navigation)
    try {
      const saved = sessionStorage.getItem(storageKey) || "";
      let isReload = false;

      // Modern navigation timing API
      if (performance && typeof performance.getEntriesByType === 'function') {
        const entries = performance.getEntriesByType('navigation');
        if (entries && entries[0] && entries[0].type === 'reload') isReload = true;
      }

      // Fallback for older browsers
      if (!isReload && performance && performance.navigation && performance.navigation.type === 1) {
        isReload = true;
      }

      if (isReload) {
        sessionStorage.removeItem(storageKey);
        return "";
      }

      return saved;
    } catch (e) {
      // On any error, fall back to not persisting across reloads
      try { sessionStorage.removeItem(storageKey); } catch(_) {}
      return "";
    }
  });
  // dateError can be boolean or string message
  const [dateError, setDateError] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist selected date per current patient in sessionStorage
  useEffect(() => {
    if (selectedDate) {
      sessionStorage.setItem(storageKey, selectedDate);
    } else {
      sessionStorage.removeItem(storageKey);
    }
  }, [selectedDate, storageKey]);

  // If patient changes (login/logout), reload the selected date for that patient
  useEffect(() => {
    const newPatientId = localStorage.getItem('patientId') || '';
    const newKey = newPatientId ? `${storageKeyBase}_${newPatientId}` : storageKeyBase;
    const saved = sessionStorage.getItem(newKey) || "";
    setSelectedDate(saved);
    // clear any previous date error when patient/context changes
    setDateError(false);
    // Note: we don't modify storageKey variable here; next render will use updated key
  }, [/* run on mount and when localStorage patientId might change */]);

  const isDoctorAvailableOnSelectedDate = (doctor, dateStr) => {
    if (!dateStr) return true;

    const schedules = doctor?.raw?.availabilitySchedules;
    if (!Array.isArray(schedules) || schedules.length === 0) return false;

    const selectedDateObj = new Date(`${dateStr}T00:00:00`);
    const selectedDayName = selectedDateObj.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const selectedDayIndex = selectedDateObj.getDay();
    const dayIndexMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    return schedules.some((schedule) => {
      const scheduleDay = String(schedule?.day || "").trim().toLowerCase();
      if (!scheduleDay) return false;

      const selectedDayLower = selectedDayName.toLowerCase();
      if (scheduleDay === selectedDayLower) return true;
      if (scheduleDay === selectedDayLower.slice(0, 3)) return true;
      if (dayIndexMap[scheduleDay] === selectedDayIndex) return true;
      if (scheduleDay === "all" || scheduleDay === "everyday" || scheduleDay === "daily") {
        return true;
      }

      return false;
    });
  };

  const filtered = doctors.filter((d) => {
    if (!d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (
      selectedSpecialties.length > 0 &&
      !selectedSpecialties.includes(d.specialty)
    )
      return false;
    if (
      selectedHospital &&
      selectedHospital !== "All Hospitals" &&
      d.hospital !== selectedHospital
    )
      return false;
    if (!isDoctorAvailableOnSelectedDate(d, selectedDate)) return false;
    return true;
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching doctors from API: http://localhost:6010/api/doctors");
        const res = await axios.get("http://localhost:6010/api/doctors");
        console.log("Doctors API response:", res);
        const data = res.data && res.data.data ? res.data.data : [];
        const mapped = data.map((d) => ({
          id: d._id || d.id,
          name: d.fullName || d.name || "Unknown",
          specialty: d.specialization || d.specialty || "General",
          hospital: d.baseHospital || d.hospital || "-",
          experience: d.experienceYears
            ? `${d.experienceYears}+ Years`
            : d.experience || "-",
          rating: d.rating || d.avgRating || 0,
          image: d.photo || d.image || "",
          raw: d,
        }));
        setDoctors(mapped);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError(err);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  return (
    <div className="appointment-page">
      <div className="appointment-container">

        <TopSearch search={search} setSearch={setSearch} />

        <div className="main-content">
          <div className="filters-section">
            <FilterSidebar
              selectedSpecialties={selectedSpecialties}
              setSelectedSpecialties={setSelectedSpecialties}
              selectedHospital={selectedHospital}
              setSelectedHospital={setSelectedHospital}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              dateError={dateError}
              setDateError={setDateError}
              onClear={() => {
                setSelectedSpecialties([]);
                setSelectedHospital("All Hospitals");
                setSelectedDate("");
                setDateError(false);
              }}
            />
          </div>

          <div className="doctors-section">
            {loading ? (
              <div className="loading-state">Loading doctors...</div>
            ) : error ? (
              <div className="error-state">
                Error loading doctors. Please try again.
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">No doctors available</div>
            ) : (
              <div className="doctors-grid">
                {filtered.map((doc) => (
                  <DoctorCard
                    key={doc.id}
                    doctor={doc}
                    selectedDate={selectedDate}
                    setDateError={setDateError}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointment;