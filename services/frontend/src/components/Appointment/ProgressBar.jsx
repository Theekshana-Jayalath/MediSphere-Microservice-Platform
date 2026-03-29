import React from "react";

// Mapping of statuses to step index (1-based)
const STATUS_MAP = {
  find_doctor: 1,
  booked: 2,
  paid: 3,
  approved: 4,
  rejected: 4,
};

const DEFAULT_LABELS = ["Find Doctor", "Booked", "Paid", "Approved"];

const ProgressBar = ({ appointmentStatus = 'booked', labels = DEFAULT_LABELS }) => {
  const currentStep = STATUS_MAP[appointmentStatus] || 1;
  const steps = labels.length;

  return (
    <div className="progress-bar-container">
      <div className="progress-steps">
        <div className="progress-line" aria-hidden></div>
  {labels.map((label, idx) => {
          const step = idx + 1;
          let status = step < currentStep ? 'completed' : step === currentStep ? 'active' : 'upcoming';
          // if appointment is rejected, mark final step as rejected
          if (appointmentStatus === 'rejected' && step === steps) status = 'rejected';

          return (
            <div key={label} className={`progress-step ${status}`}>
              <div className="step-circle">{step}</div>
              <div className="step-label">{label}</div>
            </div>
          );
  })}
      </div>
    </div>
  );
};

export default ProgressBar;
