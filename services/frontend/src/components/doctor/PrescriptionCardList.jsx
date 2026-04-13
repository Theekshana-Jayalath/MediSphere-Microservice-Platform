const PrescriptionCardList = ({
  prescriptions,
  onDelete,
  onDownload,
  onSelect,
  selectedPrescription,
}) => {
  const normalizeStatus = (status) => {
    if (!status) return "Active";

    const normalized = status.toString().trim().toLowerCase();

    if (normalized === "active") return "Active";
    if (normalized === "completed") return "Completed";
    if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";

    return status;
  };

  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "Active") return "status-active";
    if (normalized === "Completed") return "status-completed";
    if (normalized === "Cancelled") return "status-cancelled";

    return "status-active";
  };

  const getDoctorName = (prescription) => {
    if (typeof prescription?.doctorId === "object" && prescription?.doctorId?.fullName) {
      return prescription.doctorId.fullName;
    }

    return prescription?.doctorName || "Dr. Unknown";
  };

  const getPatientName = (prescription) => {
    return prescription?.patientName || "Unknown Patient";
  };

  const getAppointmentId = (prescription) => {
    if (typeof prescription?.appointmentId === "object" && prescription?.appointmentId?._id) {
      return prescription.appointmentId._id;
    }

    return prescription?.appointmentId || "N/A";
  };

  const getIssuedDate = (prescription) => {
    const rawDate = prescription?.issuedDate || prescription?.createdAt;

    if (!rawDate) return "N/A";

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return parsedDate.toLocaleDateString("en-CA");
  };

  return (
    <div className="prescription-card-grid">
      {prescriptions.map((prescription) => {
        const prescriptionId = prescription._id || prescription.id;
        const isSelected =
          (selectedPrescription?._id || selectedPrescription?.id) === prescriptionId;

        return (
          <div
            key={prescriptionId}
            className={`prescription-card ${isSelected ? "selected-card" : ""}`}
            onClick={() => onSelect?.(prescription)}
          >
            <div className="prescription-card-top">
              <div className="prescription-card-avatar">
                {getPatientName(prescription).charAt(0)}
              </div>

              <div className="prescription-card-main">
                <div className="prescription-card-heading">
                  <h3>{getPatientName(prescription)}</h3>
                  <span
                    className={`doctor-prescription-status-badge ${getStatusClass(
                      prescription?.status
                    )}`}
                  >
                    {normalizeStatus(prescription?.status)}
                  </span>
                </div>

                <p className="prescription-card-doctor">
                  {getDoctorName(prescription)}
                </p>
              </div>
            </div>

            <div className="prescription-card-body">
              <div className="prescription-card-meta">
                <span>🆔 {String(getAppointmentId(prescription))}</span>
                <span>📅 {getIssuedDate(prescription)}</span>
              </div>

              <div className="prescription-card-diagnosis">
                <strong>Diagnosis</strong>
                <p>{prescription?.diagnosis || "No diagnosis available"}</p>
              </div>

              <div className="prescription-card-footer">
                <span className="medicine-count">
                  💊 {prescription?.medicines?.length || 0} medicines
                </span>
              </div>
            </div>

            <div className="prescription-card-actions">
              <button
                type="button"
                className="card-download-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  onDownload?.(prescription);
                }}
              >
                Download
              </button>

              <button
                type="button"
                className="card-delete-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete?.(prescriptionId);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrescriptionCardList;