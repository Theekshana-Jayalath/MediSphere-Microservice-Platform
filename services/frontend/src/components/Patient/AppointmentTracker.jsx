import React from "react";

const steps = [
  { key: "booked", label: "Doctor Booked" },
  { key: "confirmed", label: "Booking Confirmed" },
  { key: "paid", label: "Payment Successful" },
  { key: "approved", label: "Doctor Approval" },
  { key: "completed", label: "Completed" },
];

export default function AppointmentTracker({ status, appointment, onClose }) {
  const getStepState = (stepKey) => {
    switch (status) {
      case "PENDING_PAYMENT":
        if (stepKey === "booked" || stepKey === "confirmed") return "completed";
        if (stepKey === "paid") return "active";
        return "pending";
      case "CONFIRMED":
        if (["booked", "confirmed", "paid"].includes(stepKey)) return "completed";
        if (stepKey === "approved") return "active";
        return "pending";
      case "COMPLETED":
        return ["booked", "confirmed", "paid", "approved", "completed"].includes(stepKey) ? "completed" : "pending";
      case "CANCELLED":
        if (stepKey === "booked") return "completed";
        if (stepKey === "confirmed") return "cancelled";
        return "stopped";
      case "REJECTED":
        if (["booked", "confirmed", "paid"].includes(stepKey)) return "completed";
        if (stepKey === "approved") return "cancelled";
        return "stopped";
      default:
        if (stepKey === "booked") return "completed";
        if (stepKey === "confirmed") return "active";
        return "pending";
    }
  };

  const labelMap = {
    PENDING_PAYMENT: { text: "Waiting for Payment", color: "#ed6c02", bg: "rgba(237,108,2,0.07)" },
    CONFIRMED: { text: "Payment Complete · Awaiting Approval", color: "#344966", bg: "rgba(52,73,102,0.07)" },
    COMPLETED: { text: "Appointment Completed", color: "#2e7d32", bg: "rgba(46,125,50,0.07)" },
    CANCELLED: { text: "Cancelled by Patient", color: "#c0392b", bg: "rgba(192,57,43,0.07)" },
    REJECTED: { text: "Rejected by Doctor", color: "#c0392b", bg: "rgba(192,57,43,0.07)" },
  };
  const label = labelMap[status] || { text: "In Progress", color: "#344966", bg: "rgba(52,73,102,0.07)" };

  const iconMap = {
    completed: <span className="material-symbols-outlined" style={{ fontSize: 17 }}>check</span>,
    active: <span className="material-symbols-outlined" style={{ fontSize: 17 }}>hourglass_top</span>,
    cancelled: <span className="material-symbols-outlined" style={{ fontSize: 17 }}>close</span>,
    stopped: <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#c7d9e5" }}>remove</span>,
    pending: <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#c7d9e5" }}>radio_button_unchecked</span>,
  };

  const pctMap = { COMPLETED: 100, CONFIRMED: 60, REJECTED: 60, PENDING_PAYMENT: 40, CANCELLED: 20 };
  const stepsMap = { COMPLETED: "5/5", CONFIRMED: "3/5", REJECTED: "3/5", PENDING_PAYMENT: "2/5", CANCELLED: "1/5" };
  const pct = pctMap[status] || 20;
  const stepsText = stepsMap[status] || "1/5";
  const barColor = ["CANCELLED","REJECTED"].includes(status) ? "#c0392b" : status === "COMPLETED" ? "#2e7d32" : "#1d2d44";

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e8e0da" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1d2d44", display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>timeline</span>Tracking
        </h3>
        {onClose && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><span className="material-symbols-outlined" style={{ fontSize: 18, color: "#b0bcc8" }}>close</span></button>}
      </div>
      {appointment && (
        <div style={{ background: "#fdfbf9", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 11, color: "#344966" }}>
          <div style={{ fontWeight: 600, color: "#1d2d44" }}>{appointment.doctorName}</div>
          <div>{appointment.specialization}</div>
          <div style={{ opacity: 0.7, marginTop: 1 }}>
            {new Date(appointment.appointmentDate).toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric" })} · {appointment.startTime}
          </div>
        </div>
      )}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, background: label.bg, color: label.color, fontSize: 11, fontWeight: 600, marginBottom: 14 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: label.color, animation: (status==="CONFIRMED"||status==="PENDING_PAYMENT")?"pulse 1.8s infinite":"none" }}></span>
        {label.text}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, idx) => {
          const state = getStepState(step.key);
          const last = idx === steps.length - 1;
          return (
            <div key={step.key} style={{ display: "flex", gap: 10, minHeight: state === "stopped" ? 26 : 44, opacity: state === "stopped" ? 0.35 : 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: state === "completed" ? "#2e7d32" : state === "active" ? "#1d2d44" : state === "cancelled" ? "#c0392b" : "#f5efeb",
                  color: state === "pending" || state === "stopped" ? "#c7d9e5" : "#fff",
                  boxShadow: state === "active" ? "0 0 0 5px rgba(29,45,68,0.08)" : state === "completed" ? "0 0 0 3px rgba(46,125,50,0.06)" : "none",
                  transition: "0.4s"
                }}>
                  {iconMap[state]}
                </div>
                {!last && <div style={{ width: 2, flex: 1, minHeight: 16, background: state === "completed" ? "#2e7d32" : state === "cancelled" ? "#c0392b" : "#e8e0da", borderRadius: 2, transition: "0.4s" }}></div>}
              </div>
              <div style={{ paddingBottom: last ? 0 : 4 }}>
                <div style={{
                  fontSize: 12, fontWeight: state === "active" ? 600 : 500,
                  color: state === "cancelled" ? "#c0392b" : state === "completed" || state === "active" ? "#1d2d44" : "#8b9aab",
                  textDecoration: state === "cancelled" ? "line-through" : "none"
                }}>
                  {step.label}
                </div>
                {state === "active" && <div style={{ fontSize: 10, color: "#344966", marginTop: 1 }}>In progress...</div>}
                {state === "completed" && <div style={{ fontSize: 10, color: "#2e7d32", marginTop: 1 }}>Done ✓</div>}
                {state === "cancelled" && <div style={{ fontSize: 10, color: "#c0392b", marginTop: 1, fontWeight: 600 }}>{status === "REJECTED" ? "Rejected" : "Cancelled"}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0ebe4" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8b9aab", marginBottom: 4 }}>
          <span>Progress</span><span style={{ fontWeight: 600, color: "#1d2d44" }}>{stepsText} steps</span>
        </div>
        <div style={{ height: 6, borderRadius: 10, background: "#f5efeb", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 10, width: `${pct}%`, background: barColor, transition: "width 0.7s" }}></div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.4)}}`}</style>
    </div>
  );
}