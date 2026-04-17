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

const SessionCard = ({
  session,
  onStart,
  onComplete,
  isUpdating,
}) => {
  const status = (session?.status || "scheduled").toLowerCase();

  const canStart = status === "scheduled";
  const canComplete = status === "started" || status === "scheduled";

  return (
    <div className="doctor-session-card">
      <div className="doctor-session-card-top">
        <div>
          <div className="doctor-session-badge">{session?.specialty || "General"}</div>
          <h3 className="doctor-session-patient-name">{session?.patientName || "Unknown Patient"}</h3>
          <p className="doctor-session-meta">
            <strong>Patient Email:</strong> {session?.patientEmail || "N/A"}
          </p>
          <p className="doctor-session-meta">
            <strong>Patient Phone:</strong> {session?.patientPhone || "N/A"}
          </p>
          <p className="doctor-session-meta">
            <strong>Scheduled:</strong> {formatDateTime(session?.scheduledTime)}
          </p>
          <p className="doctor-session-meta">
            <strong>Room:</strong> {session?.roomName || "N/A"}
          </p>
          <p className="doctor-session-meta">
            <strong>Appointment ID:</strong> {session?.appointmentId || "N/A"}
          </p>
        </div>

        <div className={`doctor-session-status doctor-session-status-${status}`}>
          {status}
        </div>
      </div>

      <div className="doctor-session-link-box">
        <span className="doctor-session-link-label">Meeting Link</span>
        <a
          href={session?.meetingLink}
          target="_blank"
          rel="noreferrer"
          className="doctor-session-link"
        >
          Join Video Consultation
        </a>
      </div>

      {session?.notes && (
        <div className="doctor-session-notes">
          <strong>Notes:</strong> {session.notes}
        </div>
      )}

      <div className="doctor-session-actions">
        <button
          type="button"
          className="doctor-session-btn doctor-session-btn-start"
          onClick={() => onStart(session._id)}
          disabled={!canStart || isUpdating}
        >
          Start Session
        </button>

        <button
          type="button"
          className="doctor-session-btn doctor-session-btn-complete"
          onClick={() => onComplete(session._id)}
          disabled={!canComplete || isUpdating}
        >
          Mark Complete
        </button>
      </div>
    </div>
  );
};

export default SessionCard;