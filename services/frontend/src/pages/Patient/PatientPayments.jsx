import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/Patient/PatientSidebar";
import "../../styles/Patient/PatientPayments.css";

export default function PatientPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 4;

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const storedPatientProfile = localStorage.getItem("patientProfile");
  const patientProfile = storedPatientProfile
    ? JSON.parse(storedPatientProfile)
    : null;

  const patientName =
    patientProfile?.name || patientProfile?.fullName || user?.name || "Patient";

  // For display in UI
  const patientId = patientProfile?.patientId || user?.patientId || "PAT0004";

  // For backend lookup (matches payment collection patientId)
  const paymentPatientId = patientProfile?.userId || user?.id || "";

  const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL
    ? import.meta.env.VITE_API_GATEWAY_URL
    : "http://localhost:5015";

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        "";

      if (!paymentPatientId) {
        setPayments([]);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_GATEWAY_URL}/api/payments/patient/${paymentPatientId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getMockPayments = () => {
    return [
      {
        _id: "69c7c2f96f9f54d1af9572b3",
        appointmentId: "APT001",
        patientId: "PAT0004",
        doctorId: "DOC001",
        doctorName: "Dr. Sarah Vance",
        serviceType: "Online Consultation",
        amount: 4500,
        currency: "LKR",
        paymentMethod: "PayHere",
        status: "PENDING",
        createdAt: "2024-10-20T10:30:00.000Z",
        updatedAt: "2024-10-20T10:30:00.000Z",
      },
      {
        _id: "69c7c32d6f9f54d1af9572b5",
        appointmentId: "APT002",
        patientId: "PAT0004",
        doctorId: "DOC002",
        doctorName: "Dr. Ryan Miller",
        serviceType: "Blood Diagnostic Test",
        amount: 12800,
        currency: "LKR",
        paymentMethod: "PayHere",
        status: "PAID",
        createdAt: "2024-10-05T09:00:00.000Z",
        updatedAt: "2024-10-05T09:15:00.000Z",
      },
      {
        _id: "69c7c32d6f9f54d1af9572b6",
        appointmentId: "APT003",
        patientId: "PAT0004",
        doctorId: "DOC003",
        doctorName: "Dr. Aisha Patel",
        serviceType: "Mental Wellness Screening",
        amount: 5000,
        currency: "LKR",
        paymentMethod: "PayHere",
        status: "PAID",
        createdAt: "2024-09-28T11:45:00.000Z",
        updatedAt: "2024-09-28T12:00:00.000Z",
      },
      {
        _id: "69c7c32d6f9f54d1af9572b7",
        appointmentId: "APT004",
        patientId: "PAT0004",
        doctorId: "DOC001",
        doctorName: "Dr. Sarah Vance",
        serviceType: "Follow-up Session",
        amount: 3200,
        currency: "LKR",
        paymentMethod: "PayHere",
        status: "PAID",
        createdAt: "2024-10-12T14:15:00.000Z",
        updatedAt: "2024-10-12T14:20:00.000Z",
      },
      {
        _id: "69c7c32d6f9f54d1af9572b8",
        appointmentId: "APT005",
        patientId: "PAT0004",
        doctorId: "DOC004",
        doctorName: "Dr. Michael Chen",
        serviceType: "Physical Therapy",
        amount: 6200,
        currency: "LKR",
        paymentMethod: "PayHere",
        status: "PAID",
        createdAt: "2024-09-15T09:00:00.000Z",
        updatedAt: "2024-09-15T09:10:00.000Z",
      },
      {
        _id: "69c7c32d6f9f54d1af9572b9",
        appointmentId: "APT006",
        patientId: "PAT0004",
        doctorId: "DOC001",
        doctorName: "Dr. Sarah Vance",
        serviceType: "Cardiology Checkup",
        amount: 7500,
        currency: "LKR",
        paymentMethod: "PayHere",
        status: "PAID",
        createdAt: "2024-09-05T13:30:00.000Z",
        updatedAt: "2024-09-05T13:45:00.000Z",
      },
    ];
  };

  const normalizePaymentStatus = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "SUCCESS") return "PAID";
    if (normalized === "FAILED") return "FAILED";
    return normalized;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount) => {
    return `LKR ${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadgeClass = (status) => {
    const normalizedStatus = normalizePaymentStatus(status);
    if (normalizedStatus === "PAID") return "paid";
    if (normalizedStatus === "FAILED") return "failed";
    return "pending";
  };

  const getDoctorInitials = (doctorName) => {
    return String(doctorName || "Doctor")
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const calculateTotals = () => {
    const totalSpent = payments
      .filter((p) => normalizePaymentStatus(p.status) === "PAID")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pendingAmount = payments
      .filter((p) => normalizePaymentStatus(p.status) === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const lastTransaction = [...payments]
      .filter((p) => normalizePaymentStatus(p.status) === "PAID")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    return { totalSpent, pendingAmount, lastTransaction };
  };

  const filteredPayments = payments.filter((payment) => {
    const normalizedStatus = normalizePaymentStatus(payment.status);
    const matchesSearch =
      String(payment.doctorName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(payment.serviceType || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || normalizedStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const { totalSpent, pendingAmount, lastTransaction } = calculateTotals();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("patientProfile");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleExportAll = () => {
    const exportRows = filteredPayments.map((payment) => ({
      date: formatDate(payment.createdAt),
      appointmentId: payment.appointmentId || "",
      doctorName: payment.doctorName || "",
      serviceType: payment.serviceType || "",
      amount: payment.amount || 0,
      currency: payment.currency || "LKR",
      paymentMethod: payment.paymentMethod || "",
      status: normalizePaymentStatus(payment.status) || "",
      patientId: payment.patientId || "",
      doctorId: payment.doctorId || "",
      paymentId: payment._id || "",
    }));

    const headers = [
      "Date",
      "Appointment ID",
      "Doctor Name",
      "Service Type",
      "Amount",
      "Currency",
      "Payment Method",
      "Status",
      "Patient ID",
      "Doctor ID",
      "Payment ID",
    ];

    const escapeCSV = (value) => {
      const stringValue = String(value ?? "");
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.join(","),
      ...exportRows.map((row) =>
        [
          row.date,
          row.appointmentId,
          row.doctorName,
          row.serviceType,
          row.amount,
          row.currency,
          row.paymentMethod,
          row.status,
          row.patientId,
          row.doctorId,
          row.paymentId,
        ]
          .map(escapeCSV)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];

    link.href = url;
    link.setAttribute("download", `patient-payments-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
  };

  return (
    <div className="patient-payments-page">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <PatientSidebar
        patientName={patientName}
        patientId={patientId}
        activeItem="payments"
        onLogout={handleLogout}
      />

      <main className="patient-payments-main">
        <header className="patient-payments-topbar">
          <div className="topbar-left">
            <h2>Billing History</h2>
          </div>
          <div className="topbar-right">
            <div className="search-wrapper">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="notification-btn">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        <div className="patient-payments-content">
          <section className="summary-grid">
            <div className="summary-card compact-summary-card">
              <div className="card-icon primary">
                <span className="material-symbols-outlined">
                  account_balance_wallet
                </span>
              </div>
              <div className="card-badge">Annual</div>
              <p className="card-label">Total Spent</p>
              <h3>{formatAmount(totalSpent)}</h3>
              <div className="card-trend">
                <span className="material-symbols-outlined">trending_up</span>
                <span>12% increase from last year</span>
              </div>
            </div>

            <div className="summary-card compact-summary-card">
              <div className="card-icon secondary">
                <span className="material-symbols-outlined">
                  pending_actions
                </span>
              </div>
              <div className="card-badge warning">Action Required</div>
              <p className="card-label">Pending Payments</p>
              <h3>{formatAmount(pendingAmount)}</h3>
              <p className="card-due">Next due date: Oct 24, 2024</p>
            </div>

            <div className="summary-card compact-summary-card">
              <div className="card-icon tertiary">
                <span className="material-symbols-outlined">history</span>
              </div>
              <p className="card-label">Last Transaction</p>
              <h3>
                {lastTransaction
                  ? formatAmount(lastTransaction.amount)
                  : "LKR 0.00"}
              </h3>
              <p className="card-transaction">
                {lastTransaction
                  ? `Paid to ${lastTransaction.doctorName} • ${formatDate(
                      lastTransaction.createdAt
                    )}`
                  : "No transactions yet"}
              </p>
            </div>
          </section>

          <section className="transactions-section">
            <div className="transactions-header">
              <div>
                <h4>Recent Transactions</h4>
                <p>Comprehensive history of your medical investments</p>
              </div>
              <div className="header-actions">
                <div className="filter-buttons">
                  <button
                    className={filterStatus === "all" ? "active" : ""}
                    onClick={() => {
                      setFilterStatus("all");
                      setCurrentPage(1);
                    }}
                  >
                    All
                  </button>
                  <button
                    className={filterStatus === "PAID" ? "active" : ""}
                    onClick={() => {
                      setFilterStatus("PAID");
                      setCurrentPage(1);
                    }}
                  >
                    Paid
                  </button>
                  <button
                    className={filterStatus === "PENDING" ? "active" : ""}
                    onClick={() => {
                      setFilterStatus("PENDING");
                      setCurrentPage(1);
                    }}
                  >
                    Pending
                  </button>
                </div>
                <button className="export-btn" onClick={handleExportAll}>
                  <span className="material-symbols-outlined">download</span>
                  Export All
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">Loading transactions...</div>
            ) : paginatedPayments.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-outlined">receipt_long</span>
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-right">Amount</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Payment Method</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="date-cell">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="amount-cell text-right">
                          {formatAmount(payment.amount)}
                        </td>
                        <td className="text-center">
                          <span
                            className={`status-badge ${getStatusBadgeClass(
                              payment.status
                            )}`}
                          >
                            {normalizePaymentStatus(payment.status)}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="payment-method-badge">
                            {payment.paymentMethod || "PayHere"}
                          </span>
                        </td>
                        <td className="actions-cell text-right">
                          <button
                            className="action-btn view-btn"
                            title="View Details"
                            onClick={() => handleViewDetails(payment)}
                          >
                            <span className="material-symbols-outlined">
                              visibility
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredPayments.length > 0 && (
              <div className="table-footer">
                <p className="pagination-info">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredPayments.length)}{" "}
                  of {filteredPayments.length} transactions
                </p>
                <div className="pagination-controls">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <span className="material-symbols-outlined">
                      chevron_left
                    </span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        className={currentPage === page ? "active" : ""}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="payments-footer">
          <p>Powered by Ethereal AI Health Intelligence</p>
        </footer>
      </main>

      {/* Modal Popup for Payment Details - Centered */}
      {showModal && selectedPayment && (
        <div className="payment-modal-overlay" onClick={closeModal}>
          <div className="payment-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal">
              <div className="payment-modal-header">
                <h3>Payment Details</h3>
                <button className="modal-close-btn" onClick={closeModal}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="payment-modal-content">
                <div className="detail-row">
                  <span className="detail-label">Transaction ID:</span>
                  <span className="detail-value">{selectedPayment._id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Appointment ID:</span>
                  <span className="detail-value">{selectedPayment.appointmentId || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDateTime(selectedPayment.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Doctor Name:</span>
                  <span className="detail-value">{selectedPayment.doctorName || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Service Type:</span>
                  <span className="detail-value">{selectedPayment.serviceType || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value amount">{formatAmount(selectedPayment.amount)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value">{selectedPayment.paymentMethod || "PayHere"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status-badge ${getStatusBadgeClass(selectedPayment.status)}`}>
                    {normalizePaymentStatus(selectedPayment.status)}
                  </span>
                </div>
                {selectedPayment.transactionId && (
                  <div className="detail-row">
                    <span className="detail-label">Transaction Reference:</span>
                    <span className="detail-value">{selectedPayment.transactionId}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span className="detail-value">{formatDateTime(selectedPayment.updatedAt)}</span>
                </div>
              </div>
              <div className="payment-modal-footer">
                <button className="modal-close-button" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}