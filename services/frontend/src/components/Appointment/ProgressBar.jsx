// import React from "react";

// // Mapping of statuses to step index (1-based)
// const STATUS_MAP = {
//   find_doctor: 1,
//   booked: 2,
//   paid: 3,
//   approved: 4,
//   rejected: 4,
// };

// const DEFAULT_LABELS = ["Find Doctor", "Book Appointment", "Make Payment"];

// const ProgressBar = ({ appointmentStatus = 'find_doctor', labels = DEFAULT_LABELS, currentStep = 1 }) => {
//   const steps = labels.length;

//   return (
//     <div className="progress-bar-container">
//       <div className="progress-steps">
//         <div className="progress-line" aria-hidden></div>
//         {/* colored fill that shows progress up to the current step */}
//         <div
//           className="progress-line-fill"
//           aria-hidden
//           style={{ 
//             width: (() => {
//               if (steps <= 1) return '0%';
//               const pct = ((Math.max(0, currentStep - 1)) / (steps - 1)) * 100;
//               return `${pct}%`;
//             })() 
//           }}
//         ></div>
        
//         {labels.map((label, idx) => {
//           const step = idx + 1;
//           let status;
          
//           if (step < currentStep) {
//             status = 'completed';
//           } else if (step === currentStep) {
//             status = 'active';
//           } else {
//             status = 'upcoming';
//           }
          
//           // if appointment is rejected, mark final step as rejected
//           if (appointmentStatus === 'rejected' && step === steps) status = 'rejected';

//           return (
//             <div key={label} className={`progress-step ${status}`}>
//               <div className="step-circle">
//                 {status === 'completed' ? '✓' : step}
//               </div>
//               <div className="step-label">{label}</div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default ProgressBar;