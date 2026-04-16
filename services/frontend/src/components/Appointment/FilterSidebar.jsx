import React from "react";

const FilterSidebar = ({
  selectedSpecialties,
  setSelectedSpecialties,
  selectedHospital,
  setSelectedHospital,
  selectedDate,
  setSelectedDate,
  dateError,
  setDateError,
  onClear,
}) => {
  const specialties = [
    { name: "Cardiology" },
    { name: "Neurology"},
    { name: "Pediatrics" },
    { name: "Dermatology" },
    { name: "General Surgery" },
  ];

  const hospitals = [
    "All Hospitals",
    "Karapitiya National Hospital",
    "Natianal Hospital",
    "colombo",
    "Matara Hospital",
  ];

  const handleSpecialtyChange = (specialty) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== specialty));
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  const handleClear = () => {
    onClear();
    setDateError(false);
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h3>Filters</h3>
        <button onClick={handleClear} className="clear-btn">
          Clear
        </button>
      </div>

      <div className="filter-section">
        <h4>SPECIALTY</h4>
        {specialties.map((specialty) => (
          <label key={specialty.name} className="filter-checkbox">
            <input
              type="checkbox"
              checked={selectedSpecialties.includes(specialty.name)}
              onChange={() => handleSpecialtyChange(specialty.name)}
            />
            <span className="checkbox-label">
              {specialty.name}
              {specialty.rating && (
                <span className="specialty-rating"> {specialty.rating}</span>
              )}
            </span>
          </label>
        ))}
      </div>

      <div className="filter-section">
        <h4>HOSPITAL</h4>
        <select
          value={selectedHospital}
          onChange={(e) => setSelectedHospital(e.target.value)}
          className="hospital-select"
        >
          {hospitals.map((hospital) => (
            <option key={hospital} value={hospital}>
              {hospital}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <h4>Appointment Date</h4>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setDateError(false);
          }}
          className="date-input"
        />
        {dateError && (
          <p className="error-message">Please select an appointment date</p>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;