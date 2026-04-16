import React from "react";

// Helper: format Date to hh:mm AM/PM
const formatTime = (date) => {
  const hh = date.getHours();
  const mm = date.getMinutes();
  const mer = hh >= 12 ? "PM" : "AM";
  const h = ((hh + 11) % 12) + 1;
  const mmStr = mm.toString().padStart(2, '0');
  return `${h.toString().padStart(2, '0')}:${mmStr} ${mer}`;
};

// Create consecutive slots of slotDurationMinutes between start and end
const buildSlots = (start, end, slotDurationMinutes = 120) => {
  const slots = [];
  let cursor = new Date(start.getTime());
  while (cursor.getTime() + slotDurationMinutes * 60000 <= end.getTime()) {
    const slotStart = new Date(cursor.getTime());
    const slotEnd = new Date(cursor.getTime() + slotDurationMinutes * 60000);
    slots.push({ start: slotStart, end: slotEnd });
    cursor = slotEnd; // move cursor forward by one slot (no overlap)
  }
  return slots;
};

const TimeSlots = ({ doctor = null, selectedDate = '', selectedTime = '', setSelectedTime }) => {
  // Determine day name from selectedDate
  const dayNameFromDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return dt.toLocaleDateString(undefined, { weekday: 'long' }); // e.g. 'Monday'
  };

  const isPast = (slot) => {
    if (!selectedDate) return false;
    const now = new Date();
    // if slot end is <= now, it's past
    return slot.end.getTime() <= now.getTime();
  };

  // Debug: show incoming schedules
  // eslint-disable-next-line no-console
  console.log('TimeSlots debug - selectedDate:', selectedDate, 'doctor availabilitySchedules:', doctor?.raw?.availabilitySchedules);

  // If doctor provides availabilitySchedules, use them; otherwise fallback to sample blocks
  const buildAllSlots = () => {
    const slotsList = [];
    const slotDurationMin = 120; // 2 hours

    if (doctor && doctor.raw && Array.isArray(doctor.raw.availabilitySchedules) && selectedDate) {
      const dayName = dayNameFromDate(selectedDate);
      const dayIndex = (selectedDate) ? (new Date(selectedDate).getDay()) : null; // 0 (Sun) - 6 (Sat)

      const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const weekdayShort = weekdayNames.map(n => n.slice(0,3));

      // Filter schedules that match the day. Accept numbers, full names, short names, arrays, or 'all'
      const schedules = doctor.raw.availabilitySchedules.filter((s) => {
        if (!s) return false;
        const val = s.day ?? s.days ?? s.weekday;
        if (!val) return false;
        // if val is array, check any match
        const values = Array.isArray(val) ? val : [val];
        return values.some(v => {
          if (v === null || v === undefined) return false;
          const vs = String(v).trim();
          if (!vs) return false;
          // numeric day
          if (/^\d+$/.test(vs)) {
            return Number(vs) === dayIndex;
          }
          const l = vs.toLowerCase();
          if (l === 'all' || l === 'everyday' || l === 'daily') return true;
          // match full name
          if (weekdayNames.map(x => x.toLowerCase()).includes(l)) return weekdayNames[dayIndex] && weekdayNames[dayIndex].toLowerCase() === l;
          // match short name
          if (weekdayShort.map(x => x.toLowerCase()).includes(l)) return weekdayShort[dayIndex] && weekdayShort[dayIndex].toLowerCase() === l;
          return false;
        });
      });

      schedules.forEach((s) => {
        // s.startTime and s.endTime expected like '08:00' or '08:00 AM' etc. We'll parse flexibly
        const parseTimeToDate = (timeStr) => {
          // accept 'HH:MM', 'HH:MM:SS' or 'HH:MM AM/PM' or 'H:MM'
          if (!timeStr) timeStr = '00:00';
          let t = String(timeStr).trim();
          // separate meridiem if present
          let mer = null;
          const merMatch = t.match(/\b(AM|PM)\b/i);
          if (merMatch) {
            mer = merMatch[1].toUpperCase();
            t = t.replace(/\b(AM|PM)\b/i, '').trim();
          }
          // remove seconds if present
          const timePart = t.split(':').slice(0,2);
          const hh = Number(timePart[0]) || 0;
          const mm = Number(timePart[1]) || 0;
          let hours = hh;
          if (mer) {
            if (mer === 'PM' && hours !== 12) hours += 12;
            if (mer === 'AM' && hours === 12) hours = 0;
          }
          const parts = selectedDate.split('-');
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), hours, mm);
        };

        const start = parseTimeToDate(s.startTime || s.start || '08:00');
        const end = parseTimeToDate(s.endTime || s.end || '17:00');
  const built = buildSlots(start, end, slotDurationMin);
  built.forEach(b => slotsList.push({ ...b, hospital: s.channelingHospital || s.location || s.baseHospital || doctor.hospital || doctor.raw.baseHospital || 'Unknown Hospital' }));
      });
    }

    // Fallback: if no slots built, generate fixed session slots (2-hour duration)
    if (slotsList.length === 0) {
      const parts = selectedDate ? selectedDate.split('-') : null;
      const makeDate = (h, m = 0) => parts ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), h, m) : null;
      const fallbacks = [
        { start: makeDate(8,0), end: makeDate(10,0), hospital: 'Central Clinic' },
        { start: makeDate(10,0), end: makeDate(12,0), hospital: 'Central Clinic' },
        { start: makeDate(13,0), end: makeDate(15,0), hospital: 'Eastside Medical Hub' },
        { start: makeDate(15,0), end: makeDate(17,0), hospital: 'Eastside Medical Hub' },
        { start: makeDate(17,0), end: makeDate(19,0), hospital: 'Telemedicine' },
      ];
      fallbacks.forEach(f => {
        if (!f.start || !f.end) return;
        slotsList.push({ start: f.start, end: f.end, hospital: f.hospital });
      });
    }

  // debug list
  // eslint-disable-next-line no-console
  console.log('TimeSlots debug - built slotsList:', slotsList);
  return slotsList;
  };

  const slots = buildAllSlots();
  const rawSchedules = doctor?.raw?.availabilitySchedules || doctor?.raw?.availability || doctor?.raw?.availabilitySchedule || [];

  const SlotGrid = ({ slots }) => (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--ms-mid)', marginBottom: 8 }}>Available Slots</div>
      <div className="timeslot-grid">
        {slots.map((slot, idx) => {
          const label = `${formatTime(slot.start)} - ${formatTime(slot.end)}`;
          const disabled = isPast(slot);
          return (
            <button
              key={`${label}-${idx}`}
              className={`timeslot-btn ${selectedTime === label ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && setSelectedTime && setSelectedTime(label)}
              disabled={disabled}
              aria-disabled={disabled}
            >
              <div style={{ fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--ms-mid)', marginTop: 6 }}>{slot.hospital}</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="timeslot-wrapper">
      {slots.length === 0 && rawSchedules && rawSchedules.length > 0 ? (
        <div className="ms-card p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.9)' }}>
          <div style={{ fontSize: 13, color: 'var(--ms-mid)', marginBottom: 8 }}>No slots generated for selected date — raw availability (debug):</div>
          <pre style={{ maxHeight: 240, overflow: 'auto', fontSize: 12 }}>{JSON.stringify(rawSchedules, null, 2)}</pre>
        </div>
      ) : (
        <SlotGrid slots={slots} />
      )}
    </div>
  );
};

export default TimeSlots;