import React, { useState } from "react";

const TimeSlots = () => {
  const [selectedTime, setSelectedTime] = useState("01:00 PM - 03:00 PM");

  const morning = ["08:00 AM - 10:00 AM", "10:00 AM - 12:00 PM"];
  const afternoon = ["01:00 PM - 03:00 PM", "03:00 PM - 05:00 PM"];
  const evening = ["05:00 PM - 07:00 PM", "07:00 PM - 09:00 PM"];

  const SlotGrid = ({ title, slots }) => (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--ms-mid)', marginBottom: 8 }}>{title}</div>
      <div className="timeslot-grid">
        {slots.map((slot) => (
          <button
            key={slot}
            className={`timeslot-btn ${selectedTime === slot ? "selected" : ""}`}
            onClick={() => setSelectedTime(slot)}
          >
            <div style={{ fontWeight: 700 }}>{slot}</div>
            <div style={{ fontSize: 12, color: 'var(--ms-mid)', marginTop: 6 }}>Central Clinic</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="timeslot-wrapper">
      <SlotGrid title="Morning Session" slots={morning} />
      <SlotGrid title="Afternoon Session" slots={afternoon} />
      <SlotGrid title="Evening Session" slots={evening} />
    </div>
  );
};

export default TimeSlots;