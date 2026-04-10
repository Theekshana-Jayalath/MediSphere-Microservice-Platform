import React from "react";

let AvailabilityScheduleInput = ({
  availabilitySchedules,
  handleAvailabilityChange,
  addAvailabilityRow,
  removeAvailabilityRow,
}) => {
  return (
    <div className="doctor-register-section">
      <div className="doctor-register-section-header">
        <h3>Availability Schedule</h3>
        <p>Add your weekly channeling availability</p>
      </div>

      {availabilitySchedules.map((slot, index) => (
        <div className="availability-row" key={index}>
          <div className="doctor-register-grid three-columns">
            <div className="doctor-register-field">
              <label>Day</label>
              <select
                value={slot.day}
                onChange={(event) =>
                  handleAvailabilityChange(index, "day", event.target.value)
                }
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

            <div className="doctor-register-field">
              <label>Start Time</label>
              <input
                type="time"
                value={slot.startTime}
                onChange={(event) =>
                  handleAvailabilityChange(index, "startTime", event.target.value)
                }
              />
            </div>

            <div className="doctor-register-field">
              <label>End Time</label>
              <input
                type="time"
                value={slot.endTime}
                onChange={(event) =>
                  handleAvailabilityChange(index, "endTime", event.target.value)
                }
              />
            </div>
          </div>

          <div className="availability-row-actions">
            {availabilitySchedules.length > 1 && (
              <button
                type="button"
                className="doctor-register-remove-btn"
                onClick={() => removeAvailabilityRow(index)}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        className="doctor-register-secondary-btn"
        onClick={addAvailabilityRow}
      >
        + Add Another Schedule
      </button>
    </div>
  );
};

export default AvailabilityScheduleInput;