import { useMemo, useState } from "react";
import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import "../../styles/Doctor/doctorAvailability.css";

const createEmptySlot = () => ({
  id: "",
  hospital: "",
  department: "",
  location: "",
  day: "",
  startTime: "",
  endTime: "",
  type: "In-Person",
  status: "Available",
});

const initialAvailability = [
  {
    id: "AVL001",
    hospital: "Nawaloka Hospital",
    department: "Cardiology",
    location: "Colombo 02",
    day: "Monday",
    startTime: "08:00",
    endTime: "12:00",
    type: "In-Person",
    status: "Available",
  },
  {
    id: "AVL002",
    hospital: "Asiri Hospital",
    department: "Cardiology",
    location: "Colombo 05",
    day: "Wednesday",
    startTime: "16:00",
    endTime: "20:00",
    type: "In-Person",
    status: "Available",
  },
  {
    id: "AVL003",
    hospital: "Medisphere Virtual",
    department: "Telemedicine",
    location: "Online",
    day: "Friday",
    startTime: "18:00",
    endTime: "21:00",
    type: "Video Call",
    status: "Available",
  },
];

const DoctorAvailability = () => {
  const [availabilityList, setAvailabilityList] = useState(initialAvailability);
  const [formData, setFormData] = useState(createEmptySlot());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filterDay, setFilterDay] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.hospital.trim()) {
      setError("Hospital name is required.");
      return false;
    }

    if (!formData.location.trim()) {
      setError("Location is required.");
      return false;
    }

    if (!formData.day) {
      setError("Please select a day.");
      return false;
    }

    if (!formData.startTime) {
      setError("Start time is required.");
      return false;
    }

    if (!formData.endTime) {
      setError("End time is required.");
      return false;
    }

    if (formData.startTime >= formData.endTime) {
      setError("End time must be later than start time.");
      return false;
    }

    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const newSlot = {
      ...formData,
      id: `AVL${Date.now().toString().slice(-6)}`,
    };

    setAvailabilityList((previous) => [newSlot, ...previous]);
    setFormData(createEmptySlot());
    setMessage("Availability slot added successfully.");
    setIsSubmitting(false);
  };

  const handleDelete = (slotId) => {
    setAvailabilityList((previous) =>
      previous.filter((slot) => slot.id !== slotId)
    );
    setMessage("Availability slot deleted successfully.");
    setError("");
  };

  const handleStatusToggle = (slotId) => {
    setAvailabilityList((previous) =>
      previous.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              status: slot.status === "Available" ? "Unavailable" : "Available",
            }
          : slot
      )
    );
  };

  const filteredAvailability = useMemo(() => {
    return availabilityList.filter((slot) => {
      const dayMatch = filterDay === "All" || slot.day === filterDay;
      const typeMatch = filterType === "All" || slot.type === filterType;
      return dayMatch && typeMatch;
    });
  }, [availabilityList, filterDay, filterType]);

  return (
    <div className="doctor-availability-layout">
      <DoctorSidebar />

      <main className="doctor-availability-main">
        <div className="availability-topbar">
          <div>
            <h1 className="availability-page-title">Doctor Availability</h1>
            <p className="availability-page-subtitle">
              Manage your channeling hospitals, consultation slots, and weekly
              availability schedule.
            </p>
          </div>

          <div className="availability-summary-badge">
            <span>Total Slots</span>
            <strong>{availabilityList.length}</strong>
          </div>
        </div>

        {message && <div className="availability-alert success">{message}</div>}
        {error && <div className="availability-alert error">{error}</div>}

        <section className="availability-grid">
          <div className="availability-form-card">
            <div className="availability-card-header">
              <h2>Add Availability</h2>
              <p>Create new consultation availability for your patients</p>
            </div>

            <form onSubmit={handleSubmit} className="availability-form">
              <div className="availability-form-grid">
                <div className="availability-field">
                  <label>Hospital Name</label>
                  <input
                    type="text"
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleChange}
                    placeholder="Nawaloka Hospital"
                  />
                </div>

                

                <div className="availability-field full-width">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Colombo 02"
                  />
                </div>

                <div className="availability-field">
                  <label>Day</label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleChange}
                  >
                    <option value="">Select Day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div className="availability-field">
                  <label>Appointment Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Video Call">Video Call</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>

                <div className="availability-field">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="availability-field">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="availability-field full-width">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="availability-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "+ Add Availability Slot"}
              </button>
            </form>
          </div>

          <div className="availability-list-card">
            <div className="availability-card-header">
              <h2>Availability Overview</h2>
              <p>View, filter, toggle, and delete your consultation slots</p>
            </div>

            <div className="availability-filters">
              <div className="availability-filter-field">
                <label>Filter by Day</label>
                <select
                  value={filterDay}
                  onChange={(event) => setFilterDay(event.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div className="availability-filter-field">
                <label>Filter by Type</label>
                <select
                  value={filterType}
                  onChange={(event) => setFilterType(event.target.value)}
                >
                  <option value="All">All</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Video Call">Video Call</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div className="availability-list">
              {filteredAvailability.length > 0 ? (
                filteredAvailability.map((slot) => (
                  <div className="availability-item-card" key={slot.id}>
                    <div className="availability-item-top">
                      <div>
                        <h3>{slot.hospital}</h3>
                      </div>

                      <span
                        className={`availability-status ${
                          slot.status === "Available"
                            ? "status-available"
                            : "status-unavailable"
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>

                    <div className="availability-item-info">
                      <span>📍 {slot.location}</span>
                      <span>📅 {slot.day}</span>
                      <span>
                        ⏰ {slot.startTime} - {slot.endTime}
                      </span>
                      <span>🩺 {slot.type}</span>
                    </div>

                    <div className="availability-item-actions">
                      <button
                        type="button"
                        className="toggle-btn"
                        onClick={() => handleStatusToggle(slot.id)}
                      >
                        {slot.status === "Available"
                          ? "Mark Unavailable"
                          : "Mark Available"}
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(slot.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="availability-empty-state">
                  No availability slots found for the selected filters.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorAvailability;