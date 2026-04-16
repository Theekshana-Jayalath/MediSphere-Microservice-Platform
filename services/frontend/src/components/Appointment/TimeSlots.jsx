import React, { useState } from "react";

const TimeSlots = ({ selectedDate = '', selectedTime = '', setSelectedTime }) => {

  const morning = ["08:00 AM - 10:00 AM", "10:00 AM - 12:00 PM"];
  const afternoon = ["01:00 PM - 03:00 PM", "03:00 PM - 05:00 PM"];
  const evening = ["05:00 PM - 07:00 PM", "07:00 PM - 09:00 PM"];

  // parse a slot like "01:00 PM - 03:00 PM" and return an object with start and end as Date for the selectedDate
  const parseSlotToRange = (slotStr) => {
    if (!selectedDate) return null;
    const [startStr, endStr] = slotStr.split(' - ').map(s => s.trim());
    const parseTime = (timeStr) => {
      // timeStr example: "01:00 PM"
      const [time, meridiem] = timeStr.split(' ');
      let [hh, mm] = time.split(':').map(Number);
      if (meridiem === 'PM' && hh !== 12) hh += 12;
      if (meridiem === 'AM' && hh === 12) hh = 0;
      const parts = selectedDate.split('-'); // YYYY-MM-DD
      const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), hh, mm);
      return dt;
    };
    return { start: parseTime(startStr), end: parseTime(endStr) };
  };

  const isSlotPast = (slotStr) => {
    const range = parseSlotToRange(slotStr);
    if (!range) return false; // if no date selected, don't consider past
    const now = new Date();
    // if selectedDate is before today, all slots are past; if selectedDate is today, compare end time to now
    const sel = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (sel < today) return true;
    if (sel > today) return false;
    // selected date is today: if slot end <= now, treat as past
    return range.end <= now;
  };

  const SlotGrid = ({ title, slots }) => (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--ms-mid)', marginBottom: 8 }}>{title}</div>
      <div className="timeslot-grid">
        {slots.map((slot) => {
          const disabled = isSlotPast(slot);
          return (
            <button
              key={slot}
              className={`timeslot-btn ${selectedTime === slot ? "selected" : ""} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && setSelectedTime && setSelectedTime(slot)}
              disabled={disabled}
              aria-disabled={disabled}
            >
              <div style={{ fontWeight: 700 }}>{slot}</div>
              <div style={{ fontSize: 12, color: 'var(--ms-mid)', marginTop: 6 }}>Central Clinic</div>
            </button>
          );
        })}
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