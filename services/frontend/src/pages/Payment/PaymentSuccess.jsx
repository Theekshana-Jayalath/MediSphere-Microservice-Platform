import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../../styles/payment.css';
import { getMyPatientProfile } from '../../services/patientApi';
import { getDoctorById } from '../../services/doctor/doctorService';
import axios from 'axios';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const receiptRef = useRef(null);
  
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadStatus, setDownloadStatus] = useState('');

  const params = new URLSearchParams(location.search);
  const orderId = params.get('order_id');
  const statusCode = params.get('status_code');
  const isSuccess = statusCode === '2';

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        // Get appointment data from localStorage
        const appointmentData = JSON.parse(localStorage.getItem('appointmentData') || '{}');
        const pendingAppointmentId = localStorage.getItem('pendingAppointmentId');
        const patientId = localStorage.getItem('patientId');
        
        console.log('📋 Fetching appointment details:', { pendingAppointmentId, patientId });

        // Initialize with default values
        let finalDetails = {
          appointmentId: pendingAppointmentId || appointmentData.appointmentId || `APT_${Date.now()}`,
          appointmentDate: appointmentData?.selectedDate || new Date().toISOString().split('T')[0],
          appointmentTime: appointmentData?.selectedTime || '00:00',
          consultationFee: Number(appointmentData?.consultationFee || 0),
          serviceCharge: Number(appointmentData?.serviceCharge ?? 500),
          tax: Number(appointmentData?.tax || 0),
          totalAmount: Number(appointmentData?.amount || 0),
          paymentStatus: isSuccess ? 'PAID' : 'PENDING',
          appointmentStatus: 'PENDING_DOCTOR_APPROVAL',
          paymentDate: new Date().toLocaleString(),
          consultationType: appointmentData?.consultationType || 'Online',
          // Default values
          patientName: 'Guest Patient',
          patientEmail: 'N/A',
          patientPhone: 'N/A',
          doctorName: 'Dr. Specialist',
          specialization: 'Specialist',
          hospital: 'MediSPhere Center',
          doctorId: appointmentData?.doctorId || appointmentData?.doctor?._id || null
        };

        // Normalize consultation type
        finalDetails.consultationType = String(finalDetails.consultationType || '').toLowerCase() === 'physical' ? 'Physical' : 'Online';

        // Calculate tax and total if missing
        if (!finalDetails.tax || finalDetails.tax === 0) {
          finalDetails.tax = Number((finalDetails.consultationFee || 0) * 0.04);
        }
        
        if (!finalDetails.totalAmount || finalDetails.totalAmount === 0) {
          finalDetails.totalAmount = finalDetails.consultationFee + finalDetails.serviceCharge + finalDetails.tax;
        }

        // Fetch Patient Details
        // Try to resolve patient either by explicit patientId, by auth token (/me), or by local cached profile
        try {
          const token = localStorage.getItem('token');
          const cached = localStorage.getItem('patientProfile');
          let patientData = null;

          if (patientId || token) {
            console.log('👤 Attempting to resolve patient details', { patientId, hasToken: !!token });
            if (token) {
              try {
                const patientResp = await getMyPatientProfile();
                // Handle common response shapes: { data: { patient: {...} } } or { data: {...} }
                if (patientResp && patientResp.data) {
                  patientData = patientResp.data.patient || patientResp.data;
                } else {
                  patientData = patientResp;
                }
                console.log('👤 Loaded patient from /me API');
              } catch (apiErr) {
                console.warn('⚠️ getMyPatientProfile failed, will try local cache:', apiErr?.message || apiErr);
              }
            }
          }

          // Fallback to locally cached profile (if any)
          if (!patientData && cached) {
            try {
              const parsed = JSON.parse(cached);
              patientData = parsed.patient || parsed || null;
              console.log('👤 Loaded patient from localStorage.patientProfile');
            } catch (cacheErr) {
              console.warn('⚠️ Failed to parse local patientProfile cache:', cacheErr);
            }
          }

          // Final fallback: use basic info from localStorage.user (set at login)
          if (!patientData) {
            try {
              const rawUser = localStorage.getItem('user');
              if (rawUser) {
                const userObj = JSON.parse(rawUser);
                patientData = {
                  name: userObj?.name || userObj?.fullName || null,
                  email: userObj?.email || null,
                  phone: userObj?.phone || null,
                };
                console.log('👤 Loaded patient from localStorage.user as fallback');
              }
            } catch (uErr) {
              // ignore
            }
          }

          if (patientData) {
            const fullName = patientData.fullName || patientData.name || patientData.fullname ||
              `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() || finalDetails.patientName;

            finalDetails = {
              ...finalDetails,
              patientName: fullName || 'Guest Patient',
              patientEmail: patientData.email || patientData.emailAddress || finalDetails.patientEmail,
              patientPhone: patientData.phone || patientData.mobile || patientData.contact || finalDetails.patientPhone,
            };

            console.log('✅ Patient details resolved:', finalDetails.patientName);
          }
        } catch (patientError) {
          console.error('❌ Error resolving patient details:', patientError);
        }

        // Fetch Doctor Details
        const doctorId = finalDetails.doctorId;
        if (doctorId) {
          try {
            console.log('👨‍⚕️ Fetching doctor details for ID:', doctorId);
            
            // Try primary doctor service first
            let doctorData = null;
            
            try {
              const docResp = await getDoctorById(doctorId);
              doctorData = (docResp && docResp.data) ? docResp.data : docResp;
            } catch (primaryError) {
              console.warn('⚠️ Primary doctor service failed, trying fallback:', primaryError.message);
              
              // Fallback to direct API call
              try {
                const fallbackResp = await axios.get(`http://localhost:6010/api/doctors/${doctorId}`);
                doctorData = fallbackResp.data;
              } catch (fallbackError) {
                console.warn('⚠️ Fallback doctor service also failed:', fallbackError.message);
              }
            }
            
            if (doctorData) {
              console.log('📋 Doctor data received:', doctorData);
              
              // Extract specialization from various possible fields
              const specialization = 
                doctorData.specialization || 
                doctorData.speciality || 
                doctorData.specialty || 
                doctorData.department || 
                doctorData.field || 
                doctorData.qualification ||
                'Specialist';
              
              // Extract hospital from various possible fields
              // Prefer stored appointmentData.selectedHospital if present, otherwise extract from doctorData
              const storedAppointmentData = JSON.parse(localStorage.getItem('appointmentData') || '{}');
              const hospital = 
                storedAppointmentData?.selectedHospital ||
                doctorData.hospital || 
                doctorData.baseHospital || 
                doctorData.clinic || 
                doctorData.workplace ||
                'MediSPhere Center';
              
              // Extract doctor name
              const doctorName = 
                doctorData.fullName || 
                doctorData.name || 
                `${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim() ||
                `Dr. ${doctorData.displayName || ''}`.trim() ||
                finalDetails.doctorName;
              
              finalDetails = {
                ...finalDetails,
                doctorName: doctorName,
                specialization: specialization,
                hospital: hospital,
              };
              
              console.log('✅ Doctor details loaded:', { doctorName, specialization, hospital });
            }
          } catch (doctorError) {
            console.error('❌ Error fetching doctor details:', doctorError);
          }
        }

        // Store receipt and clear pending data
        if (isSuccess) {
          localStorage.setItem('lastReceipt', JSON.stringify(finalDetails));
          localStorage.removeItem('pendingAppointmentId');
          localStorage.removeItem('appointmentData');
        }

        console.log('✅ Final appointment details:', finalDetails);
        setAppointmentDetails(finalDetails);
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Error in fetchAppointmentDetails:', error);
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [orderId, isSuccess]);

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    
    setDownloadStatus('Generating PDF...');
    
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add website branding
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Generated by MediSPhere Center', pdfWidth / 2, 10, { align: 'center' });
      
      pdf.addImage(imgData, 'PNG', 0, 15, pdfWidth, pdfHeight);
      
      // Add footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Page ${i} of ${pageCount} | Appointment Receipt | ${new Date().toLocaleDateString()}`,
          pdfWidth / 2,
          pdf.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        );
      }
      
      pdf.save(`Appointment_Receipt_${appointmentDetails?.appointmentId || 'receipt'}.pdf`);
      setDownloadStatus('Download Complete!');
      
      setTimeout(() => setDownloadStatus(''), 2000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setDownloadStatus('Download Failed');
      setTimeout(() => setDownloadStatus(''), 2000);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="payment-redirect-container">
        <div className="payment-redirect-card">
          <div className="spinner-small"></div>
          <p>Loading appointment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="payment-success-wrapper">
        {/* Success Header */}
        <div className="success-header">
          <div className={`success-icon ${isSuccess ? 'success' : 'error'}`}>
            {isSuccess ? '✓' : '✗'}
          </div>
          <h1 className="success-title">
            {isSuccess ? 'Payment Successful!' : 'Payment Status'}
          </h1>
          <p className="success-subtitle">
            {isSuccess 
              ? 'Thank you for your payment. Your appointment request has been submitted.'
              : 'There was an issue with your payment. Please try again.'}
          </p>
        </div>

        {/* Important Notice */}
        {isSuccess && (
          <div className="notice-box">
            <div className="notice-icon">📋</div>
            <div className="notice-content">
              <h3>Important Notice</h3>
              <p>
                Your appointment is currently <strong>pending doctor's approval</strong>. 
                You will receive a confirmation notification once the doctor approves your appointment. 
                Please check your email and SMS for updates.
              </p>
              <p className="notice-note">
                Expected response time: Within 2-4 hours during working hours.
              </p>
            </div>
          </div>
        )}

        {/* Appointment Receipt Card */}
        {appointmentDetails && (
          <div className="receipt-container" ref={receiptRef}>
            {/* Receipt Header with Branding */}
            <div className="receipt-header">
              <div className="brand-section">
                <h2 className="brand-name">🏥 MediSPhere Center</h2>
                <p className="brand-tagline">Your Health, Our Priority</p>
              </div>
              <div className="receipt-badge">
                <span className={`status-badge ${isSuccess ? 'paid' : 'pending'}`}>
                  {appointmentDetails.paymentStatus}
                </span>
              </div>
            </div>

            <div className="receipt-divider"></div>

            {/* Appointment ID and Date */}
            <div className="receipt-meta-simple">
              <div className="meta-row">
                <span className="meta-label">Appointment ID:</span>
                <span className="meta-value">{appointmentDetails.appointmentId}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Appointment Date:</span>
                <span className="meta-value">{formatDate(appointmentDetails.appointmentDate)}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Appointment Time:</span>
                <span className="meta-value">{appointmentDetails.appointmentTime}</span>
              </div>
            </div>

            <div className="receipt-divider light"></div>

            {/* Patient Information */}
            <div className="receipt-section">
              <h3 className="section-title">👤 Patient Information</h3>
              <div className="info-rows">
                <div className="info-row">
                  <span className="info-label">Full Name:</span>
                  <span className="info-value">{appointmentDetails.patientName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{appointmentDetails.patientEmail}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{appointmentDetails.patientPhone}</span>
                </div>
              </div>
            </div>

            <div className="receipt-divider light"></div>

            {/* Doctor Information */}
            <div className="receipt-section">
              <h3 className="section-title">👨‍⚕️ Doctor Information</h3>
              <div className="info-rows">
                <div className="info-row">
                  <span className="info-label">Doctor Name:</span>
                  <span className="info-value highlight">{appointmentDetails.doctorName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Specialization:</span>
                  <span className="info-value">{appointmentDetails.specialization}</span>
                </div>
                {appointmentDetails.consultationType === 'Physical' && (
                  <div className="info-row">
                    <span className="info-label">Hospital:</span>
                    <span className="info-value">{appointmentDetails.hospital}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Consultation Type:</span>
                  <span className="info-value">{appointmentDetails.consultationType}</span>
                </div>
              </div>
            </div>

            <div className="receipt-divider light"></div>

            {/* Payment Summary - Row by Row */}
            <div className="receipt-section">
              <h3 className="section-title">💰 Payment Details</h3>
              <div className="payment-rows">
                <div className="payment-row">
                  <span className="payment-label">Consultation Fee</span>
                  <span className="payment-value">LKR {appointmentDetails.consultationFee.toFixed(2)}</span>
                </div>
                <div className="payment-row">
                  <span className="payment-label">Service Charge</span>
                  <span className="payment-value">LKR {appointmentDetails.serviceCharge.toFixed(2)}</span>
                </div>
                <div className="payment-row">
                  <span className="payment-label">Healthcare Tax (4%)</span>
                  <span className="payment-value">LKR {appointmentDetails.tax.toFixed(2)}</span>
                </div>
                <div className="payment-row total-row">
                  <span className="payment-label">Total Amount Paid</span>
                  <span className="payment-value total">LKR {appointmentDetails.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="receipt-divider light"></div>

            {/* Status Section */}
            <div className="receipt-section">
              <h3 className="section-title">📊 Status Information</h3>
              <div className="info-rows">
                <div className="info-row">
                  <span className="info-label">Payment Status:</span>
                  <span className={`status-badge-small ${appointmentDetails.paymentStatus.toLowerCase()}`}>
                    {appointmentDetails.paymentStatus}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Appointment Status:</span>
                  <span className="status-badge-small pending">
                    {appointmentDetails.appointmentStatus}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Payment Date:</span>
                  <span className="info-value">{appointmentDetails.paymentDate}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="receipt-footer">
              <p className="footer-text">
                This is a computer-generated receipt and does not require a signature.
              </p>
              <p className="footer-brand">
                MediSPhere Center • www.medisphere.com • +94 11 234 5678
              </p>
              <p className="footer-thanks">
                Thank you for choosing MediSPhere Center!
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="success-actions">
          <button 
            onClick={handleDownloadReceipt} 
            className="action-button download"
            disabled={!!downloadStatus}
          >
            <span className="button-icon">📥</span>
            {downloadStatus || 'Download Receipt (PDF)'}
          </button>
          
          <button 
            onClick={() => navigate('/patient/dashboard')} 
            className="action-button primary"
          >
            <span className="button-icon">📅</span>
            View My Appointments
          </button>
          
          <button 
            onClick={() => navigate('/patient/dashboard')} 
            className="action-button secondary"
          >
            <span className="button-icon">🏠</span>
            Back to Dashboard
          </button>
        </div>

        {/* Help Text */}
        <p className="help-text">
          Need help? Contact our support team at{' '}
          <a href="mailto:medisphere.system@gmail.com">medisphere.system@gmail.com</a> or call{' '}
          <a href="tel:+94112345678">+94 11 234 5678</a>
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;