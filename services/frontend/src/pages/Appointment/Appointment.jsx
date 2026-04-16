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
  const [selectedDate, setSelectedDate] = useState("");
  const [dateError, setDateError] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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