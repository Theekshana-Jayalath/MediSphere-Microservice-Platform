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
    { name: "Cardiologist" },
    { name: "Neurologist"},
    { name: "Dermatologist" },
    { name: "Nephrologist" },
    { name: "Gastroenterologist" },
    { name: "Radiologist" },
    { name: "Oncologist" },
    { name: "Endocrinologist" },
    { name: "Pulmonologist" },
    { name: "Rheumatologist" },
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
        {/* Prevent choosing past dates by setting min to today and simple validation */}
        <input
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => {
            const val = e.target.value;
            const todayStr = new Date().toISOString().split('T')[0];
            setSelectedDate(val);
            // If user somehow picks a past date (manual input), show error
            if (val && val < todayStr) {
              setDateError(true);
            } else {
              setDateError(false);
            }
          }}
          className="date-input"
        />
        {dateError && (
          <p className="error-message">{typeof dateError === 'string' ? dateError : 'Please select an appointment date'}</p>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;