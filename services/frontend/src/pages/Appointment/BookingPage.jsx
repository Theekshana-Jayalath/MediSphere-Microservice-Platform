import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookingDoctorInfo from "../../components/Appointment/BookingDoctorInfo";
import ConsultationType from "../../components/Appointment/ConsultationType";
import TimeSlots from "../../components/Appointment/TimeSlots";
import "../../styles/appointment.css";

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor;
  const selectedDate = location.state?.selectedDate || '';
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Redirect to appointment page if no doctor data
  useEffect(() => {
    if (!doctor) {
      navigate('/appointment');
    }
  }, [doctor, navigate]);

  const handleConfirmBooking = () => {
    // Validate consultation type
    if (!selectedType) {
      setValidationError('Please select a consultation type');
      document.querySelector('.validation-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    // Validate time slot
    if (!selectedTime) {
      setValidationError('Please select a time slot');
      document.querySelector('.validation-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    // Clear error and proceed to payment
    setValidationError('');
    
    // Get consultation fee from doctor data (from database)
    const consultationFee = doctor?.raw?.consultationFee || doctor?.consultationFee || 500;
    
    navigate("/payment", {
      state: {
        bookingDetails: {
          doctor,
          selectedDate,
          selectedTime,
          selectedConsultation,
          consultationFee: consultationFee // Pass consultation fee from database
        }
      }
    });
  };

  if (!doctor) {
    return (
      <div className="booking-loading">
        <div className="loading-spinner"></div>
        <p>Loading booking details...</p>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        {/* Header Section */}
        <div className="booking-header">
          <div className="booking-title-section">
            <h1 className="booking-title">Book Your Consultation</h1>
            <p className="booking-subtitle">
              {selectedDate ? `Scheduled for ${selectedDate}` : 'Select a date and time for your consultation'}
            </p>
            <div className="booking-date-badge">
              <span className="date-icon">📅</span>
              <span>{selectedDate ? selectedDate : 'No date selected'}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="booking-main-grid">
          {/* Left Column */}
          <div className="booking-left-column">
            <div className="doctor-info-card">
              <BookingDoctorInfo doctor={doctor} />
            </div>
            <div className={`consultation-section ${validationError && !selectedType ? 'has-error' : ''}`}>
              <h3 className="section-title">CONSULTATION TYPE <span className="required-star">*</span></h3>
              <ConsultationType 
                onSelect={setSelectedConsultation}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="booking-right-column">
            <div className={`timeslot-section ${validationError && !selectedTime ? 'has-error' : ''}`}>
              <h3 className="section-title">AVAILABLE TIME SLOTS <span className="required-star">*</span></h3>
              <TimeSlots 
                doctor={doctor} 
                selectedDate={selectedDate} 
                selectedTime={selectedTime} 
                setSelectedTime={setSelectedTime} 
              />
            </div>
          </div>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="validation-error">
            <span className="error-icon">⚠️</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Footer */}
        <div className="booking-footer">
          <div className="booking-confirm-wrapper">
            <button 
              onClick={handleConfirmBooking} 
              className="confirm-booking-btn"
            >
              Confirm Booking →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;