import { useEffect, useMemo, useState } from "react";
import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import {
  getMyReports,
} from "../../services/doctor/reportApi.js";
import "../../styles/Doctor/doctorReports.css";

const extractReports = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.reports)) {
    return payload.reports;
  }

  return [];
};

const getReportId = (report) => report?._id || report?.id;

const DoctorReports = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getMyReports();
      const fetchedReports = extractReports(response);

      setReports(fetchedReports);

      if (selectedReport) {
        const updatedSelectedReport = fetchedReports.find(
          (report) => getReportId(report) === getReportId(selectedReport)
        );

        setSelectedReport(updatedSelectedReport || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getPatientName = (report) => {
    if (typeof report?.patientId === "object" && report?.patientId?.name) {
      return report.patientId.name;
    }

    return "Patient";
  };

  const getPatientCode = (report) => {
    if (typeof report?.patientId === "object" && report?.patientId?.patientId) {
      return report.patientId.patientId;
    }

    if (typeof report?.patientId === "string") {
      return report.patientId;
    }

    return "N/A";
  };

  const getUploadedDate = (report) => {
    const rawDate = report?.createdAt;

    if (!rawDate) return "No date";

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return parsedDate.toLocaleDateString("en-CA");
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const reportType = report.reportType || "OTHER";
      const matchesType = activeType === "All" || reportType === activeType;

      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        getPatientName(report).toLowerCase().includes(query) ||
        (report.title || "").toLowerCase().includes(query) ||
        (report.description || "").toLowerCase().includes(query) ||
        reportType.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [reports, activeType, searchTerm]);

  const handleDownload = (report) => {
    const downloadUrl = report?.fileUrl || report?.s3Url;

    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
      setMessage(`Opening ${report.fileName || report.title}...`);
    } else {
      setError("No downloadable file URL found for this report.");
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case "LAB_RESULT":
        return "type-lab";
      case "PRESCRIPTION":
        return "type-prescription";
      case "IMAGING":
        return "type-imaging";
      case "DIAGNOSTIC":
        return "type-diagnostic";
      default:
        return "type-other";
    }
  };

  return (
    <div className="doctor-reports-layout">
      <DoctorSidebar />

      <main className="doctor-reports-main">
        <div className="reports-topbar">
          <div>
            <h1 className="reports-page-title">Patient Reports</h1>
            <p className="reports-page-subtitle">
              Review uploaded reports, medical files, and patient records in one
              organized workspace.
            </p>
          </div>

          <div className="reports-stat-pill">
            <span>Total Reports</span>
            <strong>{reports.length}</strong>
          </div>
        </div>

        {message && <div className="reports-message">{message}</div>}
        {error && <div className="reports-error-message">{error}</div>}

        <section className="reports-controls-card">
          <div className="reports-type-tabs">
            {["All", "LAB_RESULT", "PRESCRIPTION", "IMAGING", "DIAGNOSTIC", "OTHER"].map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  className={`reports-tab ${
                    activeType === type ? "active-report-tab" : ""
                  }`}
                  onClick={() => setActiveType(type)}
                >
                  {type === "All" ? "All" : type.replace("_", " ")}
                </button>
              )
            )}
          </div>

          <div className="reports-search-box">
            <input
              type="text"
              placeholder="Search by title, description, or report type..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </section>

        <section className="reports-content-grid">
          <div className="reports-list-card">
            <div className="reports-card-header">
              <h2>Available Reports</h2>
              <p>Browse and manage uploaded reports</p>
            </div>

            {isLoading ? (
              <div className="reports-empty-state">Loading reports...</div>
            ) : (
              <div className="reports-list">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <div className="report-item-card" key={getReportId(report)}>
                      <div className="report-item-top">
                        <div className="report-file-icon">📄</div>

                        <div className="report-main-info">
                          <div className="report-heading-row">
                            <h3>{report.title}</h3>
                            <span
                              className={`report-type-badge ${getTypeClass(
                                report.reportType || "OTHER"
                              )}`}
                            >
                              {(report.reportType || "OTHER").replace("_", " ")}
                            </span>
                          </div>

                          <p className="report-patient-name">
                            {getPatientName(report)} • {getPatientCode(report)}
                          </p>

                          <p className="report-description">
                            {report.description || "No description available."}
                          </p>

                          <p className="report-meta">
                            {getUploadedDate(report)} •{" "}
                            {report.fileType || "Unknown"} •{" "}
                            {report.fileName || "Unnamed file"}
                          </p>
                        </div>
                      </div>

                      <div className="report-item-actions">
                        <button
                          type="button"
                          className="report-view-btn"
                          onClick={() => setSelectedReport(report)}
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          className="report-download-btn"
                          onClick={() => handleDownload(report)}
                        >
                          Download
                        </button>

                      </div>
                    </div>
                  ))
                ) : (
                  <div className="reports-empty-state">
                    No reports found for the selected search or filter.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="reports-details-card">
            <div className="reports-card-header">
              <h2>Report Details</h2>
              <p>
                {selectedReport
                  ? "Selected report information"
                  : "Select a report to preview its details"}
              </p>
            </div>

            {selectedReport ? (
              <div className="report-detail-panel">
                <div className="report-detail-icon">📋</div>

                <h3>{selectedReport.title}</h3>
                <span
                  className={`report-type-badge large-badge ${getTypeClass(
                    selectedReport.reportType || "OTHER"
                  )}`}
                >
                  {(selectedReport.reportType || "OTHER").replace("_", " ")}
                </span>

                <div className="report-detail-grid">
                  <div className="report-detail-box">
                    <span>Patient Name</span>
                    <strong>{getPatientName(selectedReport)}</strong>
                  </div>

                  <div className="report-detail-box">
                    <span>Patient ID</span>
                    <strong>{getPatientCode(selectedReport)}</strong>
                  </div>

                  <div className="report-detail-box">
                    <span>File Name</span>
                    <strong>{selectedReport.fileName || "N/A"}</strong>
                  </div>

                  <div className="report-detail-box">
                    <span>File Type</span>
                    <strong>{selectedReport.fileType || "Unknown"}</strong>
                  </div>
                </div>

                <div className="report-info-section">
                  <h4>Description</h4>
                  <p>{selectedReport.description || "No description available."}</p>
                </div>

                <div className="report-info-section">
                  <h4>Uploaded Information</h4>
                  <p>Date: {getUploadedDate(selectedReport)}</p>
                  <p>File URL: {selectedReport.fileUrl || "No public file URL"}</p>
                </div>

                <div className="report-detail-actions">
                  <button
                    type="button"
                    className="report-download-btn"
                    onClick={() => handleDownload(selectedReport)}
                  >
                    Download Report
                  </button>

                </div>
              </div>
            ) : (
              <div className="report-details-empty">
                <div className="report-details-empty-icon">🗂️</div>
                <p>
                  Select a report card from the left panel to review the full
                  report details here.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorReports;