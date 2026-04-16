import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProgressBar from "../../components/Appointment/ProgressBar";
import BookingDoctorInfo from "../../components/Appointment/BookingDoctorInfo";
import ConsultationType from "../../components/Appointment/ConsultationType";
import TimeSlots from "../../components/Appointment/TimeSlots";
import BookingConfirm from "../../components/Appointment/BookingConfirm";
import "../../styles/appointment.css";

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor;
  const selectedDate = location.state?.selectedDate || '';
  const [selectedTime, setSelectedTime] = useState('');

  // Redirect to appointment page if no doctor data
  useEffect(() => {
    if (!doctor) {
      navigate('/appointment');
    }
  }, [doctor, navigate]);

  const BackButton = () => (
    <button
      onClick={() => navigate('/appointment')}
      aria-label="Back to appointments"
      className="inline-flex items-center justify-center"
      style={{ width: 40, height: 40, borderRadius: 10, background: 'white', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(13,20,33,0.06)' }}
    >
      ←
    </button>
  );

  // Show loading or redirect while checking
  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Redirecting to appointment page...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "#f5f3ef" }}
    >
      <div style={{ maxWidth: "1250px" }} className="mx-auto booking-card-large">
        
        {/* Progress Bar */}
        <div className="pt-6 flex items-center gap-4">
          <BackButton />
          <ProgressBar appointmentStatus="booked" />
        </div>

        {/* Header */}
        <header className="text-center mt-6 mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">
            Book Your Consultation
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            {selectedDate ? `Scheduled for ${selectedDate}` : 'Select a date and time for your consultation'}
          </p>

          <div className="inline-flex items-center gap-2 mt-3 bg-white py-1 px-3 rounded-full text-sm shadow-sm">
            <span>📅</span>
            <span>{selectedDate ? selectedDate : 'No date selected'}</span>
          </div>
        </header>

        {/* MAIN GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">
            
            {/* Doctor Info */}
            <BookingDoctorInfo doctor={doctor} />

            {/* Consultation Type */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Consultation Type
              </h3>
              <ConsultationType />
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Available Time Slots
            </h3>
            <TimeSlots 
              doctor={doctor} 
              selectedDate={selectedDate} 
              selectedTime={selectedTime} 
              setSelectedTime={setSelectedTime} 
            />
          </div>

        </section>

        {/* Confirm Section */}
        <div className="mt-5">
          <BookingConfirm doctor={doctor} selectedTime={selectedTime} />
        </div>

      </div>
    </div>
  );
};

export default BookingPage;