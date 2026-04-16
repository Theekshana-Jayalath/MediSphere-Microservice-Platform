import { useEffect, useMemo, useState } from "react";
import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import "../../styles/Doctor/doctorAvailability.css";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const toLocalDateInputValue = (date) => {
  const offsetInMilliseconds = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetInMilliseconds)
    .toISOString()
    .split("T")[0];
};

const getCurrentWeekBounds = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + (6 - today.getDay()));
  weekEnd.setHours(0, 0, 0, 0);

  return {
    minDate: toLocalDateInputValue(today),
    maxDate: toLocalDateInputValue(weekEnd),
  };
};

const getDayNameFromDate = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    return "";
  }

  const selectedDate = new Date(year, month - 1, day);
  return WEEKDAY_NAMES[selectedDate.getDay()];
};

const isDateWithinCurrentWeek = (dateValue, minDate, maxDate) => {
  if (!dateValue) {
    return false;
  }

  return dateValue >= minDate && dateValue <= maxDate;
};

const createEmptySlot = () => ({
  id: "",
  channelingHospital: "",
  location: "",
  date: "",
  day: "",
  startTime: "",
  endTime: "",
  type: "In-Person",
  status: "Available",
});

const DOCTOR_SERVICE_URL =
  import.meta.env.VITE_DOCTOR_SERVICE_URL || "http://localhost:6010";

const safeParseJSON = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const DoctorAvailability = () => {
  const { minDate, maxDate } = useMemo(() => getCurrentWeekBounds(), []);
  const [availabilityList, setAvailabilityList] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [formData, setFormData] = useState(createEmptySlot());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filterDay, setFilterDay] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const getStoredDoctor = () => {
    const userData = safeParseJSON(localStorage.getItem("user") || "");
    return userData;
  };

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      ""
    );
  };

  const mapScheduleToSlot = (schedule, index, profile) => ({
    id: schedule?._id || `AVL${String(index + 1).padStart(3, "0")}`,
    channelingHospital:
      schedule?.channelingHospital ||
      profile?.channelingHospitals?.[0] ||
      profile?.baseHospital ||
      "Not specified",
    location: schedule?.location || profile?.baseHospital || "Not specified",
    date: schedule?.date || "",
    day: schedule?.day || "",
    startTime: schedule?.startTime || "",
    endTime: schedule?.endTime || "",
    type: schedule?.type || "In-Person",
    status: schedule?.isAvailable === false ? "Unavailable" : "Available",
  });

  const mapSlotToSchedule = (slot) => ({
    channelingHospital: slot.channelingHospital,
    location: slot.location,
    date: slot.date,
    day: slot.day,
    startTime: slot.startTime,
    endTime: slot.endTime,
    type: slot.type,
    isAvailable: slot.status === "Available",
  });

  const applyDoctorData = (doctor) => {
    setDoctorProfile(doctor);
    const schedules = Array.isArray(doctor?.availabilitySchedules)
      ? doctor.availabilitySchedules
      : [];

    setAvailabilityList(
      schedules.map((schedule, index) =>
        mapScheduleToSlot(schedule, index, doctor)
      )
    );

    setFormData((previous) => ({
      ...previous,
      channelingHospital: doctor?.channelingHospitals?.[0] || "",
      location: doctor?.baseHospital || "",
    }));
  };

  const availableChannelingHospitals = useMemo(() => {
    if (!Array.isArray(doctorProfile?.channelingHospitals)) {
      return [];
    }

    return doctorProfile.channelingHospitals.filter(
      (hospital) => typeof hospital === "string" && hospital.trim() !== ""
    );
  }, [doctorProfile]);

  const fetchDoctorAvailability = async () => {
    try {
      setIsLoading(true);
      setError("");

      const doctor = getStoredDoctor();
      const doctorId = doctor?.id;

      if (!doctorId) {
        setAvailabilityList([]);
        setError("Doctor session not found. Please login again.");
        return;
      }

      const response = await fetch(`${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load doctor availability.");
      }

      applyDoctorData(data?.data || null);
    } catch (fetchError) {
      setAvailabilityList([]);
      setError(fetchError.message || "Failed to load doctor availability.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAvailability();
  }, []);

  const saveAvailabilityList = async (nextList, successMessage) => {
    try {
      setIsSubmitting(true);
      setError("");

      const doctor = getStoredDoctor();
      const doctorId = doctor?.id;
      const token = getToken();

      if (!doctorId || !token) {
        throw new Error("Doctor session not found. Please login again.");
      }

      const payload = {
        availabilitySchedules: nextList.map(mapSlotToSchedule),
      };

      const response = await fetch(
        `${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save availability.");
      }

      applyDoctorData(data?.data || doctorProfile);
      setMessage(successMessage);
    } catch (saveError) {
      setError(saveError.message || "Failed to save availability.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleDateChange = (event) => {
    const { value } = event.target;

    setFormData((previous) => ({
      ...previous,
      date: value,
      day: getDayNameFromDate(value),
    }));
  };

  const validateForm = () => {
    if (!formData.channelingHospital.trim()) {
      setError("Channeling hospital name is required.");
      return false;
    }

    if (!formData.location.trim()) {
      setError("Location is required.");
      return false;
    }

    if (!formData.date) {
      setError("Please select a date.");
      return false;
    }

    if (!isDateWithinCurrentWeek(formData.date, minDate, maxDate)) {
      setError("Please select a date from today through the end of this week.");
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

    const newSlot = {
      ...formData,
      id: `AVL${Date.now().toString().slice(-6)}`,
      channelingHospital:
        formData.channelingHospital ||
        doctorProfile?.channelingHospitals?.[0] ||
        "Not specified",
      location: formData.location,
      date: formData.date,
      day: formData.day || getDayNameFromDate(formData.date),
    };

    const nextList = [newSlot, ...availabilityList];
    saveAvailabilityList(nextList, "Availability slot added successfully.");
    setFormData(createEmptySlot());
  };

  const handleDelete = (slotId) => {
    const nextList = availabilityList.filter((slot) => slot.id !== slotId);
    saveAvailabilityList(nextList, "Availability slot deleted successfully.");
  };

  const handleStatusToggle = (slotId) => {
    const nextList = availabilityList.map((slot) =>
      slot.id === slotId
        ? {
            ...slot,
            status: slot.status === "Available" ? "Unavailable" : "Available",
          }
        : slot
    );
    saveAvailabilityList(nextList, "Availability status updated successfully.");
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
                  <label>Channeling Hospital Name</label>
                  {availableChannelingHospitals.length > 0 ? (
                    <select
                      name="channelingHospital"
                      value={formData.channelingHospital}
                      onChange={handleChange}
                    >
                      <option value="">Select Channeling Hospital</option>
                      {availableChannelingHospitals.map((hospital) => (
                        <option key={hospital} value={hospital}>
                          {hospital}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="channelingHospital"
                      value={formData.channelingHospital}
                      onChange={handleChange}
                      placeholder="Asiri Hospital"
                    />
                  )}
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

                <div className="availability-field full-width">
                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleDateChange}
                    min={minDate}
                    max={maxDate}
                  />
                  <span className="field-hint">
                    Select a date from today through the end of this week.
                  </span>
                </div>

                <div className="availability-field">
                  <label>Day</label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleChange}
                    disabled
                  >
                    <option value="">Select date first</option>
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
              {isLoading ? (
                <div className="availability-empty-state">
                  Loading your availability...
                </div>
              ) : filteredAvailability.length > 0 ? (
                filteredAvailability.map((slot) => (
                  <div className="availability-item-card" key={slot.id}>
                    <div className="availability-item-top">
                      <div>
                        <h3>{slot.channelingHospital}</h3>
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
                      <span>🗓️ {slot.date}</span>
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
                        disabled={isSubmitting}
                        onClick={() => handleStatusToggle(slot.id)}
                      >
                        {slot.status === "Available"
                          ? "Mark Unavailable"
                          : "Mark Available"}
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        disabled={isSubmitting}
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