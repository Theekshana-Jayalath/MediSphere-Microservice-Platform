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
  const itemsPerPage = 4;

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  const storedPatientProfile = localStorage.getItem("patientProfile");
  const patientProfile = storedPatientProfile ? JSON.parse(storedPatientProfile) : null;
  
  const patientName = patientProfile?.name || patientProfile?.fullName || user?.name || "Patient";
  const patientId = patientProfile?.patientId || user?.patientId || "PAT0004";
  const patientEmail = patientProfile?.email || user?.email || "No email";

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5004/api/payments/patient/${patientId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        setPayments(getMockPayments());
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments(getMockPayments());
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
        updatedAt: "2024-10-20T10:30:00.000Z"
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
        updatedAt: "2024-10-05T09:15:00.000Z"
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
        updatedAt: "2024-09-28T12:00:00.000Z"
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
        updatedAt: "2024-10-12T14:20:00.000Z"
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
        updatedAt: "2024-09-15T09:10:00.000Z"
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
        updatedAt: "2024-09-05T13:45:00.000Z"
      }
    ];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatAmount = (amount) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadgeClass = (status) => {
    return status === "PAID" ? "paid" : "pending";
  };

  const getDoctorInitials = (doctorName) => {
    return doctorName.split(' ').map(n => n[0]).join('');
  };

  const calculateTotals = () => {
    const patientPayments = payments.filter(p => p.patientId === patientId);
    const totalSpent = patientPayments
      .filter(p => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pendingAmount = patientPayments
      .filter(p => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const lastTransaction = patientPayments
      .filter(p => p.status === "PAID")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    return { totalSpent, pendingAmount, lastTransaction };
  };

  const filteredPayments = payments.filter(payment => {
    const matchesPatient = payment.patientId === patientId;
    const matchesSearch = payment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    return matchesPatient && matchesSearch && matchesStatus;
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
            <div className="user-avatar">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCn_Qt3esgtuXr34odduCGODVcQ-gBns6mA8zll1mVAIpVOEYOC4h0chtXUWSWzRQFKrSJcsh7tOStCiRUyfzkluS6MIc-6hheL5_kGRjCn7GfpD0wCLr3CR5GzEE3u7xyWXij1dvTQzQMdsntbIdICQpdUw61n-ReviuK1-z8m5hj-4lskU_dndlNEPvDhRv1jsUMwL5GVE56MalxP0U91E6BnRBhGEdBigT0apPIGyhuszlQlSrfkT3LkFhiAcBRBygJbTc93O_U"
                alt="Patient Avatar"
              />
            </div>
          </div>
        </header>

        <div className="patient-payments-content">
          {/* Summary Cards */}
          <section className="summary-grid">
            <div className="summary-card">
              <div className="card-icon primary">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div className="card-badge">Annual</div>
              <p className="card-label">Total Spent</p>
              <h3>{formatAmount(totalSpent)}</h3>
              <div className="card-trend">
                <span className="material-symbols-outlined">trending_up</span>
                <span>12% increase from last year</span>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon secondary">
                <span className="material-symbols-outlined">pending_actions</span>
              </div>
              <div className="card-badge warning">Action Required</div>
              <p className="card-label">Pending Payments</p>
              <h3>{formatAmount(pendingAmount)}</h3>
              <p className="card-due">Next due date: Oct 24, 2024</p>
            </div>

            <div className="summary-card">
              <div className="card-icon tertiary">
                <span className="material-symbols-outlined">history</span>
              </div>
              <p className="card-label">Last Transaction</p>
              <h3>{lastTransaction ? formatAmount(lastTransaction.amount) : "LKR 0.00"}</h3>
              <p className="card-transaction">
                {lastTransaction ? `Paid to ${lastTransaction.doctorName} • ${formatDate(lastTransaction.createdAt)}` : "No transactions yet"}
              </p>
            </div>
          </section>

          {/* Transactions Table */}
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
                    onClick={() => setFilterStatus("all")}
                  >
                    All
                  </button>
                  <button 
                    className={filterStatus === "PAID" ? "active" : ""} 
                    onClick={() => setFilterStatus("PAID")}
                  >
                    Paid
                  </button>
                  <button 
                    className={filterStatus === "PENDING" ? "active" : ""} 
                    onClick={() => setFilterStatus("PENDING")}
                  >
                    Pending
                  </button>
                </div>
                <button className="export-btn">
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
                      <th>Practitioner</th>
                      <th>Service Type</th>
                      <th className="text-right">Amount</th>
                      <th className="text-center">Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="date-cell">{formatDate(payment.createdAt)}</td>
                        <td>
                          <div className="practitioner-info">
                            <div className="doctor-avatar">
                              {getDoctorInitials(payment.doctorName)}
                            </div>
                            <span className="doctor-name">{payment.doctorName}</span>
                          </div>
                        </td>
                        <td className="service-type">{payment.serviceType}</td>
                        <td className="amount-cell text-right">{formatAmount(payment.amount)}</td>
                        <td className="text-center">
                          <span className={`status-badge ${getStatusBadgeClass(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="actions-cell text-right">
                          <button 
                            className="action-btn receipt-btn"
                            title="View Receipt"
                          >
                            <span className="material-symbols-outlined">receipt_long</span>
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
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} transactions
                </p>
                <div className="pagination-controls">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={currentPage === page ? "active" : ""}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
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
    </div>
  );
}