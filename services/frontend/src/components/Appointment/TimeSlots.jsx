import React, { useState, useEffect } from "react";

// Helper: format Date to hh:mm AM/PM
const formatTime = (date) => {
  const hh = date.getHours();
  const mm = date.getMinutes();
  const mer = hh >= 12 ? "PM" : "AM";
  const h = ((hh + 11) % 12) + 1;
  const mmStr = mm.toString().padStart(2, '0');
  return `${h}:${mmStr} ${mer}`;
};

// Create consecutive slots of slotDurationMinutes between start and end
const buildSlots = (start, end, slotDurationMinutes = 120) => {
  const slots = [];
  let cursor = new Date(start.getTime());
  
  while (cursor.getTime() + slotDurationMinutes * 60000 <= end.getTime()) {
    const slotStart = new Date(cursor.getTime());
    const slotEnd = new Date(cursor.getTime() + slotDurationMinutes * 60000);
    slots.push({ start: slotStart, end: slotEnd });
    cursor = slotEnd;
  }
  
  // If there's remaining time that's less than slotDuration but more than 1 hour
  const remainingTime = end.getTime() - cursor.getTime();
  if (remainingTime >= 60 * 60000) { // at least 1 hour remaining
    const slotStart = new Date(cursor.getTime());
    const slotEnd = new Date(end.getTime());
    slots.push({ start: slotStart, end: slotEnd });
  }
  
  return slots;
};

const TimeSlots = ({ doctor = null, selectedDate = '', selectedTime = '', setSelectedTime }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get day name from date
  const getDayName = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return dt.toLocaleDateString('en-US', { weekday: 'long' }); // e.g., 'Monday'
  };

  // Check if slot is in the past
  const isPast = (slot) => {
    if (!selectedDate) return false;
    const now = new Date();
    return slot.end.getTime() <= now.getTime();
  };

  // Parse time string (supports "08:00", "08:00 AM", "2:30 PM", etc.)
  const parseTimeToDate = (timeStr, dateStr) => {
    if (!timeStr || !dateStr) return null;
    
    let t = String(timeStr).trim();
    let mer = null;
    
    // Check for AM/PM
    const merMatch = t.match(/\b(AM|PM)\b/i);
    if (merMatch) {
      mer = merMatch[1].toUpperCase();
      t = t.replace(/\b(AM|PM)\b/i, '').trim();
    }
    
    // Parse time
    const timeParts = t.split(':');
    let hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    
    // Adjust for AM/PM
    if (mer) {
      if (mer === 'PM' && hours !== 12) hours += 12;
      if (mer === 'AM' && hours === 12) hours = 0;
    }
    
    // Create date object
    const dateParts = dateStr.split('-');
    return new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      hours,
      minutes
    );
  };

  // Build all time slots from doctor's availability
  const buildAllSlots = () => {
    if (!doctor || !selectedDate || !doctor.raw?.availabilitySchedules) {
      return [];
    }

    const dayName = getDayName(selectedDate);
    const dayIndex = new Date(selectedDate).getDay();
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Filter schedules for the selected day
    const schedulesForDay = doctor.raw.availabilitySchedules.filter(schedule => {
      if (!schedule || !schedule.day) return false;
      
      const scheduleDay = schedule.day.trim();
      
      // Check if schedule matches by full name
      if (scheduleDay.toLowerCase() === dayName?.toLowerCase()) return true;
      
      // Check by short name (first 3 letters)
      if (scheduleDay.toLowerCase() === dayName?.slice(0, 3).toLowerCase()) return true;
      
      // Check by day index (0-6)
      const dayIndexMap = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      const scheduleDayLower = scheduleDay.toLowerCase();
      if (dayIndexMap[scheduleDayLower] === dayIndex) return true;
      
      // Check for 'all' or 'everyday'
      if (scheduleDayLower === 'all' || scheduleDayLower === 'everyday' || scheduleDayLower === 'daily') {
        return true;
      }
      
      return false;
    });

    if (schedulesForDay.length === 0) {
      console.log('No schedules found for', dayName);
      return [];
    }

    const slotDurationMinutes = 120; // 2 hours
    const allSlots = [];

    schedulesForDay.forEach(schedule => {
      const startTime = schedule.startTime;
      const endTime = schedule.endTime;
      
      if (!startTime || !endTime) {
        console.log('Missing start or end time for schedule:', schedule);
        return;
      }
      
      const startDate = parseTimeToDate(startTime, selectedDate);
      const endDate = parseTimeToDate(endTime, selectedDate);
      
      if (!startDate || !endDate) {
        console.log('Failed to parse times:', startTime, endTime);
        return;
      }
      
      // Build slots for this time range
      const builtSlots = buildSlots(startDate, endDate, slotDurationMinutes);
      
      builtSlots.forEach(slot => {
        allSlots.push({
          ...slot,
          hospital: schedule.channelingHospital || schedule.location || doctor.hospital || doctor.raw?.baseHospital || 'Hospital',
          type: schedule.type || 'In-Person'
        });
      });
    });

    // Sort slots by start time
    allSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    return allSlots;
  };

  // Generate slots when doctor or selectedDate changes
  useEffect(() => {
    if (doctor && selectedDate) {
      setLoading(true);
      const generatedSlots = buildAllSlots();
      setSlots(generatedSlots);
      setLoading(false);
    }
  }, [doctor, selectedDate]);

  // Group slots by session (morning, afternoon, evening)
  const groupSlotsBySession = (slotsList) => {
    const morning = [];
    const afternoon = [];
    const evening = [];
    
    slotsList.forEach(slot => {
      const hour = slot.start.getHours();
      if (hour < 12) {
        morning.push(slot);
      } else if (hour >= 12 && hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });
    
    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlotsBySession(slots);
  const hasSlots = slots.length > 0;

  // Render session slots
  const renderSessionSlots = (sessionSlots, title) => {
    if (sessionSlots.length === 0) return null;
    
    return (
      <div className="timeslot-session">
        <div className="timeslot-session-title">{title}</div>
        <div className="timeslot-grid">
          {sessionSlots.map((slot, idx) => {
            const label = `${formatTime(slot.start)} - ${formatTime(slot.end)}`;
            const disabled = isPast(slot);
            const isSelected = selectedTime === label;
            
            return (
              <button
                key={`${label}-${idx}`}
                className={`timeslot-btn ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setSelectedTime && setSelectedTime(label)}
                disabled={disabled}
              >
                <div className="timeslot-time">{label}</div>
                <div className="timeslot-hospital">{slot.hospital}</div>
                <div className="timeslot-type">{slot.type}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="timeslot-loading">
        <div className="loading-spinner-small"></div>
        <p>Loading available time slots...</p>
      </div>
    );
  }

  if (!hasSlots) {
    return (
      <div className="timeslot-empty">
        <p>No available time slots for {getDayName(selectedDate)}</p>
        <p className="timeslot-empty-hint">Please select another date</p>
      </div>
    );
  }

  return (
    <div className="timeslot-wrapper">
      {renderSessionSlots(morning, "Morning Session")}
      {renderSessionSlots(afternoon, "Afternoon Session")}
      {renderSessionSlots(evening, "Evening Session")}
    </div>
  );
};

export default TimeSlots;