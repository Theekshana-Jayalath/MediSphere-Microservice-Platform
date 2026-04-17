import React from "react";

const formatDateTime = (dateValue) => {
  if (!dateValue) return "Not scheduled";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PatientSessionCard = ({ session }) => {
  const status = (session?.status || "scheduled").toLowerCase();

  // 🔥 STATUS LOGIC
  const isCompleted = status === "completed";

  return (
    <div className="patient-session-card">
      <div className="patient-session-card-top">
        <div>
          <div className="patient-session-badge">
            {session?.specialty || "General"}
          </div>

          <h3 className="patient-session-doctor-name">
            {session?.doctorName || "Doctor Not Assigned"}
          </h3>

          <p className="patient-session-meta">
            <strong>Doctor Email:</strong> {session?.doctorEmail || "N/A"}
          </p>

          <p className="patient-session-meta">
            <strong>Scheduled:</strong>{" "}
            {formatDateTime(session?.scheduledTime)}
          </p>

          <p className="patient-session-meta">
            <strong>Room:</strong> {session?.roomName || "N/A"}
          </p>

          <p className="patient-session-meta">
            <strong>Appointment ID:</strong>{" "}
            {session?.appointmentId || "N/A"}
          </p>
        </div>

        <div
          className={`patient-session-status patient-session-status-${status}`}
        >
          {status}
        </div>
      </div>

      {/* 🔗 MEETING LINK SECTION */}
      <div className="patient-session-link-box">
        <span className="patient-session-link-label">Meeting Link</span>

        {session?.meetingLink ? (
          <a
            href={isCompleted ? "#" : session.meetingLink}
            target="_blank"
            rel="noreferrer"
            className={`patient-session-link ${
              isCompleted ? "disabled-link" : ""
            }`}
            onClick={(e) => {
              if (isCompleted) e.preventDefault();
            }}
          >
            {isCompleted ? "Session Completed" : "Join Session"}
          </a>
        ) : (
          <span className="patient-session-no-link">
            Link not available
          </span>
        )}
      </div>

      {/* 📝 NOTES */}
      {session?.notes && (
        <div className="patient-session-notes">
          <strong>Notes:</strong> {session.notes}
        </div>
      )}
    </div>
  );
};

export default PatientSessionCard;