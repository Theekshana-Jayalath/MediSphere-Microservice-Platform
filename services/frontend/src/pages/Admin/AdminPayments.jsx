import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../styles/Admin/AdminPayments.css";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);

  const PAYMENTS_API =
    import.meta.env.VITE_API_GATEWAY_URL
      ? `${import.meta.env.VITE_API_GATEWAY_URL}/api/payments`
      : "http://localhost:5015/api/payments";

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const res = await fetch(PAYMENTS_API, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch payments");
        }

        const data = await res.json();

        const paymentList = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : [];

        setPayments(paymentList);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [PAYMENTS_API]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return payments;

    return payments.filter((payment) => {
      return (
        String(payment._id || "").toLowerCase().includes(q) ||
        String(payment.appointmentId || "").toLowerCase().includes(q) ||
        String(payment.patientId || "").toLowerCase().includes(q) ||
        String(payment.doctorId || "").toLowerCase().includes(q) ||
        String(payment.paymentMethod || "").toLowerCase().includes(q) ||
        String(payment.status || "").toLowerCase().includes(q) ||
        String(payment.amount || "").toLowerCase().includes(q)
      );
    });
  }, [payments, search]);

  const stats = useMemo(() => {
    const isSuccessfulPayment = (payment) => {
      const status = String(payment.status || "").toUpperCase();
      return status === "PAID" || status === "SUCCESS";
    };

    const totalRevenue = payments
      .filter((p) => isSuccessfulPayment(p))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pendingPayouts = payments
      .filter((p) => String(p.status || "").toUpperCase() === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const successfulTransactions = payments.filter((p) =>
      isSuccessfulPayment(p)
    ).length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const previousDate = new Date();
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonth = previousDate.getMonth();
    const previousYear = previousDate.getFullYear();

    const currentMonthRevenue = payments
      .filter((p) => {
        const d = new Date(p.createdAt);
        return (
          isSuccessfulPayment(p) &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const previousMonthRevenue = payments
      .filter((p) => {
        const d = new Date(p.createdAt);
        return (
          isSuccessfulPayment(p) &&
          d.getMonth() === previousMonth &&
          d.getFullYear() === previousYear
        );
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    let growth = 0;
    if (previousMonthRevenue > 0) {
      growth =
        ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
        100;
    }

    return {
      totalRevenue,
      currentMonthRevenue,
      successfulTransactions,
      pendingPayouts,
      growth,
    };
  }, [payments]);

  const formatCurrency = (amount, currency = "LKR") => {
    return `${currency} ${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleString();
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toUpperCase();
    if (value === "PAID" || value === "SUCCESS") return "status-badge paid";
    if (value === "PENDING") return "status-badge pending";
    return "status-badge";
  };

  return (
    <div className="admin-payments-page">
      <AdminSidebar activeItem="payments" />

      <main className="admin-payments-main">
        <header className="payments-topbar">
          <div className="payments-topbar-left">
            <h1>Payments Overview</h1>

            <div className="payments-search">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search by payment, patient, doctor, appointment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon wallet">
              <span className="material-symbols-outlined">
                account_balance_wallet
              </span>
            </div>
            <p>Total Paid Revenue</p>
            <h3>{formatCurrency(stats.totalRevenue, "LKR")}</h3>
          </div>

          <div className="metric-card">
            <div className="metric-icon growth">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <p>Current Month Revenue</p>
            <h3>{formatCurrency(stats.currentMonthRevenue, "LKR")}</h3>
            <small>Growth: {Number(stats.growth).toFixed(1)}%</small>
          </div>

          <div className="metric-card">
            <div className="metric-icon success">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <p>Successful Transactions</p>
            <h3>{stats.successfulTransactions}</h3>
          </div>

          <div className="metric-card">
            <div className="metric-icon pending">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <p>Pending Payments</p>
            <h3>{formatCurrency(stats.pendingPayouts, "LKR")}</h3>
          </div>
        </section>

        <section className="transactions-section">
          <div className="section-header">
            <div>
              <h2>Transaction History</h2>
            </div>
          </div>

          {loading ? (
            <div className="state-box">Loading payments...</div>
          ) : error ? (
            <div className="state-box error">{error}</div>
          ) : filteredPayments.length === 0 ? (
            <div className="state-box">No payment records found.</div>
          ) : (
            <div className="table-wrapper">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Appointment ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{payment.appointmentId || "-"}</td>
                      <td>{formatCurrency(payment.amount, payment.currency)}</td>
                      <td>{payment.paymentMethod || "-"}</td>
                      <td>
                        <span className={getStatusClass(payment.status)}>
                          {payment.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td>{formatDate(payment.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="payment-view-btn"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedPayment && (
        <div
          className="payment-modal-overlay"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="payment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-modal-header">
              <h3>Payment Details</h3>
              <button type="button" onClick={() => setSelectedPayment(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="payment-modal-body">
              <div className="payment-detail-item">
                <label>Payment ID</label>
                <p>{selectedPayment._id || "-"}</p>
              </div>

              <div className="payment-detail-item">
                <label>Appointment ID</label>
                <p>{selectedPayment.appointmentId || "-"}</p>
              </div>

              <div className="payment-detail-item">
                <label>Patient ID</label>
                <p>{selectedPayment.patientId || "-"}</p>
              </div>

              <div className="payment-detail-item">
                <label>Doctor ID</label>
                <p>{selectedPayment.doctorId || "-"}</p>
              </div>

              <div className="payment-detail-item">
                <label>Amount</label>
                <p>{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
              </div>

              <div className="payment-detail-item">
                <label>Method</label>
                <p>{selectedPayment.paymentMethod || "-"}</p>
              </div>

              <div className="payment-detail-item">
                <label>Status</label>
                <p>
                  <span className={getStatusClass(selectedPayment.status)}>
                    {selectedPayment.status || "UNKNOWN"}
                  </span>
                </p>
              </div>

              <div className="payment-detail-item">
                <label>Created At</label>
                <p>{formatDate(selectedPayment.createdAt)}</p>
              </div>
            </div>

            <div className="payment-modal-footer">
              <button type="button" onClick={() => setSelectedPayment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .payment-view-btn {
          border: none;
          background: #1d2d44;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .payment-view-btn:hover {
          background: #0f1c2e;
        }

        .payment-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .payment-modal {
          width: 100%;
          max-width: 560px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
          overflow: hidden;
        }

        .payment-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #eee7e2;
        }

        .payment-modal-header h3 {
          margin: 0;
          color: #07182e;
          font-size: 20px;
          font-weight: 700;
        }

        .payment-modal-header button {
          border: none;
          background: transparent;
          cursor: pointer;
          color: #07182e;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .payment-modal-body {
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .payment-detail-item {
          background: #f8f5f2;
          padding: 14px;
          border-radius: 14px;
          min-width: 0;
        }

        .payment-detail-item label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .payment-detail-item p {
          margin: 0;
          color: #07182e;
          font-size: 14px;
          font-weight: 500;
          word-break: break-word;
        }

        .payment-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #eee7e2;
          display: flex;
          justify-content: flex-end;
        }

        .payment-modal-footer button {
          border: none;
          background: #1d2d44;
          color: #ffffff;
          padding: 10px 22px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .payment-modal-body {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}