import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/Patient/PatientSidebar";
import "../../styles/Patient/PatientPrescriptions.css";

export default function PatientPrescriptions() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  const storedPatientProfile = localStorage.getItem("patientProfile");
  const patientProfile = storedPatientProfile ? JSON.parse(storedPatientProfile) : null;
  
  const patientName = patientProfile?.name || patientProfile?.fullName || user?.name || "Patient";
  const patientId = patientProfile?.patientId || user?.patientId || "PAT0004";
  const patientEmail = patientProfile?.email || user?.email || "No email";

  // Mock data with Appointment ID
  const prescriptions = [
    {
      _id: "1",
      appointmentId: "APT901545139",
      medicineName: "Lisinopril",
      category: "Heart & Circulation",
      dosage: "10mg",
      dosageForm: "Tablet",
      frequency: "Once daily",
      prescribedBy: "Dr. David Simmons",
      instructions: "Take with or without food. Maintain consistent time each day. Avoid potassium supplements.",
      status: "ACTIVE",
      issuedDate: "2024-01-15"
    },
    {
      _id: "2",
      appointmentId: "APT901545140",
      medicineName: "Amoxicillin",
      category: "Anti-infective",
      dosage: "500mg",
      dosageForm: "Capsule",
      frequency: "Every 8 hours",
      prescribedBy: "Dr. Elena Martinez",
      instructions: "Take with food. Complete full course even if feeling better. Stay hydrated.",
      status: "ACTIVE",
      issuedDate: "2024-10-10"
    },
    {
      _id: "3",
      appointmentId: "APT901545141",
      medicineName: "Atorvastatin",
      category: "Cholesterol Control",
      dosage: "40mg",
      dosageForm: "Tablet",
      frequency: "Before bed",
      prescribedBy: "Dr. James Chen",
      instructions: "Take at the same time each night. Avoid grapefruit products. Report any muscle pain.",
      status: "ACTIVE",
      issuedDate: "2024-08-01"
    },
    {
      _id: "4",
      appointmentId: "APT901545142",
      medicineName: "Ibuprofen",
      category: "Pain Management",
      dosage: "400mg",
      dosageForm: "Tablet",
      frequency: "As needed",
      prescribedBy: "Dr. Elena Martinez",
      instructions: "Take with food. Maximum 3 tablets per day. Do not exceed 7 days without consulting doctor.",
      status: "ACTIVE",
      issuedDate: "2024-09-01"
    }
  ];

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const handleTalkToSpecialist = () => {
    navigate("/patient/appointments");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("patientProfile");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const filteredPrescriptions = prescriptions.filter(p =>
    p.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prescribedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.appointmentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="patient-prescriptions-page">
      <PatientSidebar
        patientName={patientName}
        patientId={patientId}
        activeItem="prescriptions"
        onLogout={handleLogout}
      />

      <main className="patient-prescriptions-main">
        <div className="prescriptions-container">
          <div className="prescriptions-header">
            <div>
              <h1>Prescription Management</h1>
              <p>View your prescribed medications and treatment history</p>
            </div>
          </div>

          {/* Stats Cards - Only Active Meds remains */}
          <div className="stats-grid">
            <div className="stat-card">
              <p>Active Prescriptions</p>
              <h3>{prescriptions.length}</h3>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="action-bar">
            <div className="search-wrapper">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search by medication, doctor, category or appointment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="action-buttons">
              <button className="action-btn refresh">
                <span className="material-symbols-outlined">refresh</span>
                Refresh
              </button>
              <button className="action-btn filter">
                <span className="material-symbols-outlined">filter_list</span>
                Filter
              </button>
              <button className="action-btn sort">
                <span className="material-symbols-outlined">sort</span>
                Sort
              </button>
            </div>
          </div>

          {/* Active Prescriptions Table */}
          <div className="prescriptions-table-container">
            <h2>Active Prescriptions</h2>
            
            {filteredPrescriptions.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-outlined">medication</span>
                <p>No prescriptions found</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="prescriptions-table">
                  <thead>
                    <tr>
                      <th>APPOINTMENT ID</th>
                      <th>MEDICATION</th>
                      <th>DOSAGE & FREQUENCY</th>
                      <th>PRESCRIBING PHYSICIAN</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrescriptions.map((prescription) => (
                      <tr key={prescription._id}>
                        <td className="appointment-cell">
                          <div className="appointment-id">{prescription.appointmentId}</div>
                         </td>
                        <td>
                          <div className="medication-name">{prescription.medicineName}</div>
                          <div className="medication-category">{prescription.category}</div>
                         </td>
                        <td>
                          <div>{prescription.dosage} {prescription.dosageForm}</div>
                          <div className="frequency">{prescription.frequency}</div>
                         </td>
                        <td>{prescription.prescribedBy}</td>
                        <td>
                          <button 
                            className="view-details-btn"
                            onClick={() => handleViewDetails(prescription)}
                          >
                            View Details
                            <span className="material-symbols-outlined">chevron_right</span>
                          </button>
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* View Details Modal - No Request Refill button */}
      {showDetailsModal && selectedPrescription && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Prescription Details</h3>
              <button onClick={() => setShowDetailsModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <label>APPOINTMENT ID</label>
                <p>{selectedPrescription.appointmentId}</p>
              </div>
              
              <div className="detail-section">
                <label>MEDICATION NAME</label>
                <p>{selectedPrescription.medicineName}</p>
              </div>
              
              <div className="detail-section">
                <label>CATEGORY</label>
                <p>{selectedPrescription.category}</p>
              </div>
              
              <div className="detail-row-group">
                <div className="detail-section half">
                  <label>DOSAGE</label>
                  <p>{selectedPrescription.dosage} {selectedPrescription.dosageForm}</p>
                </div>
                <div className="detail-section half">
                  <label>FREQUENCY</label>
                  <p>{selectedPrescription.frequency}</p>
                </div>
              </div>
              
              <div className="detail-section">
                <label>PRESCRIBED BY</label>
                <p>{selectedPrescription.prescribedBy}</p>
              </div>
              
              <div className="detail-section">
                <label>INSTRUCTIONS</label>
                <p className="instructions-text">{selectedPrescription.instructions}</p>
              </div>
              
              <div className="detail-section">
                <label>ISSUED DATE</label>
                <p>{new Date(selectedPrescription.issuedDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="close-modal-btn" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 550px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #ede7e3;
          position: sticky;
          top: 0;
          background: white;
          z-index: 1;
        }
        
        .modal-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #07182e;
          margin: 0;
        }
        
        .modal-header button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
        
        .modal-header button:hover {
          background: #f8f2ee;
        }
        
        .modal-body {
          padding: 24px;
        }
        
        .detail-section {
          margin-bottom: 20px;
        }
        
        .detail-section label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #75777e;
          margin-bottom: 6px;
        }
        
        .detail-section p {
          font-size: 15px;
          color: #1d1b19;
          margin: 0;
        }
        
        .detail-row-group {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .detail-section.half {
          flex: 1;
          margin-bottom: 0;
        }
        
        .instructions-text {
          line-height: 1.5;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #ede7e3;
          position: sticky;
          bottom: 0;
          background: white;
        }
        
        .close-modal-btn {
          padding: 10px 24px;
          background: #07182e;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: white;
          cursor: pointer;
        }
        
        .close-modal-btn:hover {
          background: #1d2d44;
        }
      `}</style>
    </div>
  );
}