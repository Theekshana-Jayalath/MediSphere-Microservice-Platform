import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/Patient/PatientSidebar";
import "./../../styles/Patient/PatientMedicalReports.css";

export default function PatientMedicalReports() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const storedPatientProfile = localStorage.getItem("patientProfile");
  const patientProfile = storedPatientProfile
    ? JSON.parse(storedPatientProfile)
    : null;

  const patientName =
    patientProfile?.name || patientProfile?.fullName || user?.name || "Patient";
  const patientId = patientProfile?.patientId || user?.patientId || "------";

  const lookupPatientId =
    patientProfile?.userId || user?.id || patientProfile?._id || "";

  const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL
    ? import.meta.env.VITE_API_GATEWAY_URL
    : "http://localhost:5015";

  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    reportType: "LAB_RESULT",
    doctorId: "",
    file: null,
  });

  const [reports, setReports] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingReports, setLoadingReports] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingReportId, setEditingReportId] = useState(null);
  const [doctorError, setDoctorError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ show: false, reportId: null, reportTitle: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getAuthToken = () => {
    return (
      user?.token ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  const formatDoctorDisplayName = (doctor) => {
    const rawName = doctor?.fullName || doctor?.name || doctor?.email || "Unknown";
    const cleanedName = String(rawName).replace(/^dr\.?\s*/i, "").trim();
    const specialization = doctor?.specialization ? ` - ${doctor.specialization}` : "";
    return `Dr. ${cleanedName}${specialization}`;
  };

  const resetForm = () => {
    setReportForm({
      title: "",
      description: "",
      reportType: "LAB_RESULT",
      doctorId: "",
      file: null,
    });
    setEditingReportId(null);

    const fileInput = document.getElementById("patient-report-file");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("patientProfile");
    localStorage.removeItem("patientVitals");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const parseResponseData = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    try {
      if (contentType.includes("application/json")) {
        return await response.json();
      }

      const text = await response.text();
      return {
        message: text || "Unexpected server response",
      };
    } catch (error) {
      return {
        message: "Unable to parse server response",
      };
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);

      const token = getAuthToken();

      const response = await fetch(`${API_GATEWAY_URL}/api/reports/me`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await parseResponseData(response);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch reports");
      }

      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      showToast(error.message || "Failed to load reports", "error");
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setDoctorError(null);
      const token = getAuthToken();

      if (!lookupPatientId) {
        setDoctors([]);
        setDoctorError(
          "Unable to identify the logged-in patient. Please log in again."
        );
        return;
      }

      console.log(
        "Fetching patient's doctors from:",
        `${API_GATEWAY_URL}/api/doctors/my-doctors/${lookupPatientId}`
      );

      const response = await fetch(
        `${API_GATEWAY_URL}/api/doctors/my-doctors/${lookupPatientId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      console.log("Response status:", response.status);

      const data = await parseResponseData(response);

      if (!response.ok) {
        throw new Error(
          data?.message || `Failed to fetch doctors: ${response.status}`
        );
      }

      let doctorsList = [];
      if (Array.isArray(data)) {
        doctorsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        doctorsList = data.data;
      } else if (data?.doctors && Array.isArray(data.doctors)) {
        doctorsList = data.doctors;
      }

      console.log("Doctors fetched:", doctorsList.length);
      setDoctors(doctorsList);

      if (doctorsList.length === 0) {
        setDoctorError(
          "You don't have any appointments yet. Please book an appointment with a doctor first."
        );
      } else {
        setDoctorError(null);
      }
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      setDoctorError(
        "Unable to load doctors. Please make sure you're logged in and try again."
      );
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setReportForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleEditReport = (report) => {
    setEditingReportId(report._id);
    setReportForm({
      title: report.title || "",
      description: report.description || "",
      reportType: report.reportType || "LAB_RESULT",
      doctorId: report.doctorId || "",
      file: null,
    });

    const fileInput = document.getElementById("patient-report-file");
    if (fileInput) {
      fileInput.value = "";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reportForm.title.trim()) {
      showToast("Report title is required", "error");
      return;
    }

    if (!reportForm.doctorId) {
      showToast("Please select a doctor to associate with this report", "error");
      return;
    }

    if (!editingReportId && !reportForm.file) {
      showToast("Please select a file", "error");
      return;
    }

    try {
      setSubmitting(true);

      const token = getAuthToken();
      const formData = new FormData();

      formData.append("title", reportForm.title);
      formData.append("description", reportForm.description);
      formData.append("reportType", reportForm.reportType);
      formData.append("doctorId", reportForm.doctorId);
      
      // Include patient ID for both create and update operations
      const patientIdForOperation = patientProfile?.userId || 
                                    user?.id || 
                                    patientProfile?._id || 
                                    lookupPatientId;
      
      if (patientIdForOperation) {
        formData.append("patientId", patientIdForOperation);
        console.log("Adding patientId:", patientIdForOperation);
      }

      console.log("Submitting with doctorId:", reportForm.doctorId);

      if (reportForm.file) {
        formData.append("report", reportForm.file);
        console.log("Submitting file:", reportForm.file.name);
      }

      const url = editingReportId
        ? `${API_GATEWAY_URL}/api/reports/${editingReportId}`
        : `${API_GATEWAY_URL}/api/reports/upload`;

      console.log("Submitting to API Gateway:", url);
      console.log("Auth token exists:", !!token);
      console.log("Is update operation:", !!editingReportId);

      const response = await fetch(url, {
        method: editingReportId ? "PUT" : "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      console.log("Upload response status:", response.status);
      console.log("Upload response ok:", response.ok);

      const data = await parseResponseData(response);
      console.log("Upload response data:", data);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (editingReportId
              ? "Failed to update report"
              : "Failed to upload report")
        );
      }

      resetForm();
      await fetchReports();

      showToast(
        editingReportId
          ? "Report updated successfully"
          : "Report uploaded successfully",
        "success"
      );
    } catch (error) {
      console.error("Failed to submit report:", error);
      showToast(
        error.message ||
          (editingReportId
            ? "Failed to update report"
            : "Failed to upload report"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Updated delete handler that opens custom modal
  const handleDeleteClick = (reportId, reportTitle) => {
    setDeleteModal({ show: true, reportId, reportTitle });
  };

  const confirmDelete = async () => {
    const { reportId } = deleteModal;
    
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_GATEWAY_URL}/api/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await parseResponseData(response);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete report");
      }

      if (editingReportId === reportId) {
        resetForm();
      }

      await fetchReports();
      showToast("Report deleted successfully", "success");
      setDeleteModal({ show: false, reportId: null, reportTitle: "" });
    } catch (error) {
      console.error("Failed to delete report:", error);
      showToast(error.message || "Failed to delete report", "error");
      setDeleteModal({ show: false, reportId: null, reportTitle: "" });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, reportId: null, reportTitle: "" });
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "--";
    const date = new Date(dateValue);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return "--";
    const date = new Date(dateValue);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getReportIcon = (reportType) => {
    switch (reportType) {
      case "LAB_RESULT":
        return "biotech";
      case "PRESCRIPTION":
        return "prescriptions";
      case "IMAGING":
        return "radiology";
      case "DIAGNOSTIC":
        return "medical_information";
      default:
        return "description";
    }
  };

  const getFileFormat = (fileName, fileType) => {
    if (fileType?.includes("pdf")) return "PDF";
    if (fileType?.includes("png")) return "PNG";
    if (fileType?.includes("jpeg") || fileType?.includes("jpg")) return "JPG";

    const ext = fileName?.split(".").pop()?.toUpperCase();
    return ext || "FILE";
  };

  const getDoctorName = (doctorId) => {
    if (!doctorId) return "Not assigned";
    const doctor = doctors.find((d) => d._id === doctorId || d.id === doctorId);
    if (doctor) {
      return formatDoctorDisplayName(doctor);
    }
    return "Unknown Doctor";
  };

  const filteredReports = useMemo(() => {
    const term = searchText.trim().toLowerCase();

    if (!term) return reports;

    return reports.filter((report) => {
      const title = report?.title?.toLowerCase() || "";
      const description = report?.description?.toLowerCase() || "";
      const type = report?.reportType?.toLowerCase() || "";
      const fileName = report?.fileName?.toLowerCase() || "";
      const doctorName = getDoctorName(report?.doctorId).toLowerCase();

      return (
        title.includes(term) ||
        description.includes(term) ||
        type.includes(term) ||
        fileName.includes(term) ||
        doctorName.includes(term)
      );
    });
  }, [reports, searchText, doctors]);

  const latestUpload = reports.length > 0 ? reports[0] : null;

  return (
    <div className="patient-reports-page">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <PatientSidebar
        patientName={patientName}
        patientId={patientId}
        activeItem="medicalReports"
        onLogout={handleLogout}
      />

      {toast && (
        <div className={`medical-report-toast ${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <p>{toast.message}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="delete-modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <span className="material-symbols-outlined delete-warning-icon">warning</span>
              <h3>Delete Report</h3>
            </div>
            <div className="delete-modal-body">
              <p>Are you sure you want to delete <strong>"{deleteModal.reportTitle}"</strong>?</p>
              <p className="delete-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="delete-modal-footer">
              <button className="delete-modal-cancel" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="delete-modal-confirm" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="reports-main">
        <header className="reports-topbar">
          <div className="reports-topbar-left">
            <h2>Medical Reports</h2>

            <div className="reports-search-box">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search report name, doctor, or clinic..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <div className="reports-topbar-right">
            <button className="reports-bell-btn" type="button">
              <span className="material-symbols-outlined">notifications</span>
              <span className="reports-bell-dot"></span>
            </button>

            <div
              className="reports-user-chip"
              onClick={() => navigate("/patient/profile")}
            >
              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="patient"
                className="reports-user-avatar"
              />
              <div>
                <p>{patientName}</p>
                <span>Manage Profile</span>
              </div>
            </div>
          </div>
        </header>

        <div className="reports-page-content">
          <section className="reports-hero-grid">
            <div className="reports-left-column">
              <div className="reports-hero-card">
                <div className="reports-hero-badge">
                  <span className="reports-badge-dot"></span>
                  Clinical Dashboard Active
                </div>

                <h3>
                  Your Health Intelligence,
                  <br />
                  <span>Centralized.</span>
                </h3>

                <p>
                  Securely manage and analyze your clinical records. Protected
                  privacy and a clean patient vault experience.
                </p>

                <div className="reports-hero-stats">
                  <div>
                    <strong>{reports.length}</strong>
                    <span>Reports</span>
                  </div>

                  <div className="reports-divider"></div>

                  <div>
                    <strong>
                      {latestUpload ? formatDate(latestUpload.createdAt) : "--"}
                    </strong>
                    <span>Latest Upload</span>
                  </div>
                </div>

                <span className="reports-hero-bg-icon material-symbols-outlined">
                  insights
                </span>
              </div>

              <div className="reports-insight-card">
                <div className="reports-insight-icon">
                  <span className="material-symbols-outlined">
                    auto_awesome
                  </span>
                </div>

                <div className="reports-insight-content">
                  <div className="reports-insight-header">
                    <h4>AI Diagnostic Insight</h4>
                    <span>NEW ANALYSIS</span>
                  </div>

                  <p>
                    Your uploaded reports are now available in one place. You
                    can keep adding files and they will appear below in Recent
                    Vault Activity.
                  </p>

                  <button type="button">
                    VIEW FULL ANALYSIS
                    <span className="material-symbols-outlined">
                      arrow_forward_ios
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="reports-upload-card">
              <div className="reports-upload-title">
                <div className="reports-upload-icon">
                  <span className="material-symbols-outlined">upload_file</span>
                </div>
                <h3>{editingReportId ? "Edit Report" : "Add Report"}</h3>
              </div>

              <form onSubmit={handleSubmit} className="reports-upload-form">
                <div className="reports-form-group">
                  <label>Report Title</label>
                  <input
                    type="text"
                    name="title"
                    value={reportForm.title}
                    onChange={handleChange}
                    placeholder="e.g. Annual Blood Work"
                  />
                </div>

                <div className="reports-form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={reportForm.description}
                    onChange={handleChange}
                    placeholder="Add brief notes about this report..."
                  />
                </div>

                <div className="reports-form-group">
                  <label>Report Type</label>
                  <select
                    name="reportType"
                    value={reportForm.reportType}
                    onChange={handleChange}
                  >
                    <option value="LAB_RESULT">LAB_RESULT</option>
                    <option value="PRESCRIPTION">PRESCRIPTION</option>
                    <option value="IMAGING">IMAGING</option>
                    <option value="DIAGNOSTIC">DIAGNOSTIC</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div className="reports-form-group">
                  <label>Assign to Doctor</label>
                  <select
                    name="doctorId"
                    value={reportForm.doctorId}
                    onChange={handleChange}
                    required
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#07182e",
                      opacity: 1,
                      position: "relative",
                      zIndex: 10,
                    }}
                  >
                    <option value="">-- Select a doctor --</option>
                    {loadingDoctors ? (
                      <option disabled>Loading doctors...</option>
                    ) : doctorError ? (
                      <option disabled>{doctorError}</option>
                    ) : doctors.length === 0 ? (
                      <option disabled>
                        No doctors found. Please book an appointment first.
                      </option>
                    ) : (
                      doctors.map((doctor) => (
                        <option
                          key={doctor._id || doctor.id}
                          value={doctor._id || doctor.id}
                        >
                          {formatDoctorDisplayName(doctor)}
                        </option>
                      ))
                    )}
                  </select>
                  <small
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#6c757d",
                    }}
                  >
                    Only the selected doctor will be able to view this report
                  </small>
                </div>

                <label
                  className="reports-file-drop"
                  htmlFor="patient-report-file"
                >
                  <input
                    id="patient-report-file"
                    type="file"
                    name="file"
                    onChange={handleChange}
                    hidden
                  />
                  <span className="material-symbols-outlined">
                    cloud_upload
                  </span>
                  <p>
                    {reportForm.file
                      ? reportForm.file.name
                      : editingReportId
                      ? "Choose new file (optional)"
                      : "Drop files here"}
                  </p>
                  <small>
                    {reportForm.file
                      ? `Selected: ${reportForm.file.name}`
                      : editingReportId
                      ? "Leave empty to keep current file"
                      : "PDF, JPG, PNG up to 25MB"}
                  </small>
                </label>

                <button
                  type="submit"
                  className="reports-save-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? editingReportId
                      ? "Updating..."
                      : "Saving..."
                    : editingReportId
                    ? "Update Report"
                    : "Save"}
                </button>

                {editingReportId && (
                  <button
                    type="button"
                    className="reports-save-btn"
                    onClick={resetForm}
                    style={{
                      background: "#f3ede9",
                      color: "#1d2d44",
                      boxShadow: "none",
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>
          </section>

          <section className="reports-list-section">
            <div className="reports-list-header">
              <div>
                <h3>Recent Vault Activity</h3>
                <p>
                  Manage and share your most recent medical documentation.
                </p>
              </div>

              <div className="reports-list-actions">
                <button type="button" className="filter-btn">
                  <span className="material-symbols-outlined">filter_list</span>
                  Filter
                </button>

                <button type="button" className="export-btn">
                  <span className="material-symbols-outlined">ios_share</span>
                  Export Data
                </button>
              </div>
            </div>

            <div className="reports-table-card">
              <div className="reports-table-wrap">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Report Name</th>
                      <th>Category</th>
                      <th>Assigned Doctor</th>
                      <th>Upload Date</th>
                      <th>Format/Size</th>
                      <th className="actions-head">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loadingReports ? (
                      <tr>
                        <td
                          colSpan="6"
                          style={{ textAlign: "center", padding: "24px" }}
                        >
                          Loading reports...
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          style={{ textAlign: "center", padding: "24px" }}
                        >
                          No reports found
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr key={report._id}>
                          <td>
                            <div className="report-name-cell">
                              <div className="report-icon-box">
                                <span className="material-symbols-outlined">
                                  {getReportIcon(report.reportType)}
                                </span>
                              </div>
                              <div>
                                <p>{report.title || "Untitled Report"}</p>
                                <small>
                                  {report.description ||
                                    report.fileName ||
                                    "No description"}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`report-tag ${(
                                report.reportType || "other"
                              ).toLowerCase()}`}
                            >
                              {report.reportType || "OTHER"}
                            </span>
                          </td>

                          <td>
                            <div className="report-doctor-cell">
                              <span className="doctor-badge">
                                {getDoctorName(report.doctorId)}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="report-date-cell">
                              <p>{formatDate(report.createdAt)}</p>
                              <small>{formatTime(report.createdAt)}</small>
                            </div>
                          </td>

                          <td>
                            <div className="report-format-cell">
                              <span className="file-badge">
                                {getFileFormat(report.fileName, report.fileType)}
                              </span>
                              <small>{formatFileSize(report.fileSize)}</small>
                            </div>
                          </td>

                          <td>
                            <div className="report-actions">
                              <button
                                type="button"
                                title="View"
                                onClick={() => {
                                  if (report.fileUrl) {
                                    window.open(
                                      `http://localhost:5005${report.fileUrl}`,
                                      "_blank"
                                    );
                                  } else {
                                    showToast("No file available", "error");
                                  }
                                }}
                              >
                                <span className="material-symbols-outlined">
                                  visibility
                                </span>
                              </button>

                              <button
                                type="button"
                                title="Edit"
                                onClick={() => handleEditReport(report)}
                              >
                                <span className="material-symbols-outlined">
                                  edit
                                </span>
                              </button>

                              <button
                                type="button"
                                title="Delete"
                                onClick={() => handleDeleteClick(report._id, report.title)}
                              >
                                <span className="material-symbols-outlined">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="reports-table-footer">
                <p>
                  Showing <strong>{filteredReports.length}</strong> of{" "}
                  <strong>{reports.length}</strong> reports
                </p>

                <div className="reports-pagination">
                  <button type="button" disabled>
                    PREVIOUS
                  </button>
                  <button type="button" className="next-page-btn">
                    NEXT PAGE
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="reports-bottom-cards">
            <div className="reports-info-card">
              <div className="reports-info-icon">
                <span className="material-symbols-outlined">security</span>
              </div>
              <h4>Secure Vault Storage</h4>
              <p>
                Your health data is protected by end-to-end encryption. Only
                you and authorized physicians can view your vault.
              </p>
            </div>

            <div className="reports-info-card">
              <div className="reports-info-icon">
                <span className="material-symbols-outlined">share_reviews</span>
              </div>
              <h4>Permissioned Sharing</h4>
              <p>
                Generate time-limited secure links to share specific reports
                without exposing your full history.
              </p>
            </div>

            <div className="reports-info-card">
              <div className="reports-info-icon">
                <span className="material-symbols-outlined">
                  contact_support
                </span>
              </div>
              <h4>Concierge Assistance</h4>
              <p>
                Need help digitizing physical records? Get help organizing and
                cataloging your full medical history.
              </p>
            </div>
          </section>
        </div>
      </main>

      <style>{`
        .medical-report-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 20000;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 280px;
          max-width: 420px;
          padding: 14px 18px;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.18);
          animation: reportToastSlideIn 0.25s ease;
        }

        .medical-report-toast.success {
          border-left: 5px solid #16a34a;
        }

        .medical-report-toast.error {
          border-left: 5px solid #dc2626;
        }

        .medical-report-toast span {
          font-size: 24px;
        }

        .medical-report-toast.success span {
          color: #16a34a;
        }

        .medical-report-toast.error span {
          color: #dc2626;
        }

        .medical-report-toast p {
          margin: 0;
          color: #07182e;
          font-size: 14px;
          font-weight: 600;
        }

        /* Delete Modal Styles */
        .delete-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }

        .delete-modal-content {
          background: white;
          border-radius: 24px;
          width: 90%;
          max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s ease;
          overflow: hidden;
        }

        .delete-modal-header {
          padding: 24px 24px 16px 24px;
          text-align: center;
          border-bottom: 1px solid #eef2f6;
        }

        .delete-warning-icon {
          font-size: 48px !important;
          color: #dc2626;
          background: #fef2f2;
          padding: 12px;
          border-radius: 60px;
          margin-bottom: 12px;
        }

        .delete-modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #07182e;
        }

        .delete-modal-body {
          padding: 24px;
          text-align: center;
        }

        .delete-modal-body p {
          margin: 0 0 8px 0;
          color: #334155;
          font-size: 15px;
          line-height: 1.5;
        }

        .delete-modal-warning {
          color: #dc2626 !important;
          font-size: 13px !important;
          font-weight: 500;
        }

        .delete-modal-footer {
          padding: 16px 24px 24px 24px;
          display: flex;
          gap: 12px;
          border-top: 1px solid #eef2f6;
        }

        .delete-modal-cancel,
        .delete-modal-confirm {
          flex: 1;
          padding: 12px 20px;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .delete-modal-cancel {
          background: #f1f5f9;
          color: #334155;
        }

        .delete-modal-cancel:hover {
          background: #e2e8f0;
        }

        .delete-modal-confirm {
          background: #dc2626;
          color: white;
        }

        .delete-modal-confirm:hover {
          background: #b91c1c;
        }

        .reports-form-group select {
          background-color: #ffffff !important;
          color: #07182e !important;
          opacity: 1 !important;
        }

        .reports-form-group select option {
          background-color: #ffffff !important;
          color: #07182e !important;
        }

        @keyframes reportToastSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}