import Payment from "../models/paymentModel.js";
import { generateHash } from "../utils/payhereHash.js";
import axios from "axios";

export const createPayment = async (req, res) => {
  try {
    console.log("📦 Received payment request:", req.body);
    
    const { appointmentId, patientId, doctorId, amount, contact, bookingDetails } = req.body;

    // Validate required fields
    if (!appointmentId || !patientId || !doctorId || !amount || !contact) {
      console.error("❌ Missing required fields");
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    const orderId = "ORDER_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    console.log("🆕 Created orderId:", orderId);

    // Create payment record
    const payment = new Payment({
      orderId,
      appointmentId,
      patientId,
      doctorId,
      amount: Number(amount),
      currency: "LKR",
      status: "PENDING",
      contact
      // bookingDetails: bookingDetails || {}
    });

    await payment.save();
    console.log("💾 Payment saved to database");

    // If the caller already provided an appointmentId (appointment created earlier),
    // we should NOT create a duplicate appointment — keep the same id.
    if (!appointmentId && !payment.appointmentId) {
      try {
        const appointmentServiceBase = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5002";
        const bd = payment.bookingDetails || {};
        const doc = bd.doctor || {};

        const appointmentPayload = {
          appointmentId: payment.appointmentId || `APT_${Date.now()}`,
          patientId: payment.patientId,
          doctorId: payment.doctorId,
          doctorName: doc.fullName || doc.name || "",
          doctorSpecialty: doc.specialization || doc.specialty || "",
          hospital: doc.baseHospital || doc.hospital || "",
          appointmentDate: bd.selectedDate || bd.appointmentDate || "",
          appointmentTime: bd.selectedTime || bd.appointmentTime || bd.startTime || "",
          startTime: bd.selectedTime || bd.startTime || "",
          duration: bd.duration || bd.selectedConsultation?.duration || 30,
          consultationType: bd.selectedConsultation?.type || bd.selectedConsultation || "Consultation",
          amount: payment.amount || 0,
          paymentId: payment._id.toString(),
          status: "PENDING"
        };

        console.log("📤 Creating initial appointment (PENDING) via Appointment Service:", appointmentPayload);
        const resp = await axios.post(`${appointmentServiceBase}/api/appointments`, appointmentPayload, {
          headers: { "Content-Type": "application/json" },
          timeout: 8000
        });

        console.log("✅ Initial appointment created:", resp.data);
        if (resp.data && (resp.data._id || resp.data.appointmentId)) {
          payment.appointmentId = resp.data.appointmentId || payment.appointmentId || appointmentPayload.appointmentId;
          await payment.save();
        }
      } catch (err) {
        console.error("⚠️ Could not create initial appointment (will retry on IPN):", err?.response?.data || err.message || err);
      }
    } else {
      console.log("ℹ️ Skipping appointment creation because appointmentId was provided by caller:", appointmentId || payment.appointmentId);
    }

    const formattedAmount = Number(amount).toFixed(2);
    console.log("💰 Amount:", formattedAmount);

    // Get merchant credentials
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    
    console.log("🏪 Merchant ID:", merchantId);
    
    if (!merchantId || !merchantSecret) {
      console.error("❌ Missing PayHere credentials in .env");
      return res.status(500).json({ 
        success: false, 
        message: "Payment gateway configuration error" 
      });
    }

    const hash = generateHash(merchantId, orderId, formattedAmount, "LKR", merchantSecret);
    console.log("🔐 Generated hash:", hash);

    // Extract name from contact or use default
    let firstName = "Test";
    let lastName = "User";
    let email = "test@example.com";
    let phone = "0712345678";
    
    if (contact.includes('@')) {
      email = contact;
      firstName = contact.split('@')[0];
    } else {
      phone = contact;
      firstName = "Patient";
    }

    const payhere = {
      merchant_id: merchantId,
      return_url: process.env.PAYHERE_RETURN_URL,
      cancel_url: process.env.PAYHERE_CANCEL_URL,
      notify_url: process.env.PAYHERE_NOTIFY_URL,
      order_id: orderId,
      items: `Appointment Booking - ${bookingDetails?.doctor?.name || 'Doctor Consultation'}`,
      currency: "LKR",
      amount: formattedAmount,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      address: "Colombo",
      city: "Colombo",
      country: "Sri Lanka",
      delivery_address: "",
      delivery_city: "",
      delivery_country: "",
      custom_1: "appointment_payment",
      custom_2: patientId,
      hash: hash
    };

    console.log("✅ Sending payhere data:", payhere);
    
    res.json({ 
      success: true, 
      payhere: payhere 
    });
    
  } catch (error) {
    console.error("❌ Create payment error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const handleIPN = async (req, res) => {
  console.log("📨 IPN received:", req.body);

  try {
    const body = req.body || {};

    const orderId = body.order_id || body.orderId || body.orderId;
    const statusCode = body.status_code || body.status || body.payment_status;

    // Find the payment by orderId
    if (!orderId) {
      console.error("⚠️ IPN missing order_id");
      return res.status(400).send("Missing order_id");
    }

    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      console.error("⚠️ Payment not found for orderId:", orderId);
      return res.status(404).send("Payment not found");
    }

    // PayHere uses status_code: 2 = success
    const isSuccess = String(statusCode) === "2" || String(body.status).toLowerCase() === "paid" || String(body.status).toLowerCase() === "success";

    if (!isSuccess) {
      // mark as failed
      payment.status = "FAILED";
      payment.transactionId = body.payment_id || body.transaction_id || payment.transactionId;
      await payment.save();
      console.log("⚠️ Payment marked as FAILED for orderId:", orderId);
      return res.status(200).send("OK");
    }

    // Update payment record to SUCCESS
    payment.status = "SUCCESS";
    payment.transactionId = body.payment_id || body.transaction_id || payment.transactionId || (body.paymentId || body.payhere_payment_id);
    payment.updatedAt = new Date();
    await payment.save();

    console.log("✅ Payment updated to SUCCESS for orderId:", orderId);

    // Create appointment in Appointment Service using saved payment data
    const appointmentServiceBase = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5002";

    const bd = payment.bookingDetails || {};
    const doc = bd.doctor || {};

    // Map bookingDetails -> appointment payload expected by appointment service
    const appointmentPayload = {
      appointmentId: payment.appointmentId || `APT_${Date.now()}`,
      patientId: payment.patientId,
      doctorId: payment.doctorId,
      doctorName: doc.fullName || doc.name || doc.fullName || doc.displayName || "",
      doctorSpecialty: doc.specialization || doc.specialty || "",
      hospital: doc.baseHospital || doc.hospital || "",
      appointmentDate: bd.selectedDate || bd.appointmentDate || "",
      appointmentTime: bd.selectedTime || bd.appointmentTime || bd.startTime || "",
      // include startTime and duration which appointment controller expects for overlap checks
      startTime: bd.selectedTime || bd.startTime || "",
      duration: bd.duration || 30,
      consultationType: bd.selectedConsultation || bd.consultationType || "",
      amount: payment.amount || 0,
      paymentId: payment._id.toString()
    };

    console.log("📤 Creating appointment via Appointment Service:", appointmentPayload);

    try {
      const resp = await axios.post(`${appointmentServiceBase}/api/appointments`, appointmentPayload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000
      });

      console.log("✅ Appointment created:", resp.data);

      // Optionally link appointment internal id back to payment if returned
      // If appointment creation returns appointment.appointmentId or _id, keep them
      if (resp.data && (resp.data._id || resp.data.appointmentId)) {
        payment.appointmentId = resp.data.appointmentId || payment.appointmentId;
        await payment.save();
      }

      return res.status(200).send("OK");
    } catch (err) {
      console.error("❌ Failed to create appointment after payment success:", err?.response?.data || err.message || err);
      // Keep payment as SUCCESS but log error. Respond 500 so IPN sender can retry.
      return res.status(500).send("Appointment creation failed");
    }

  } catch (error) {
    console.error("❌ IPN handler error:", error);
    return res.status(500).send("IPN processing error");
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    
    // If payment still PENDING, attempt to finalize appointment as a fallback.
    if (payment.status === "PENDING") {
      console.log("🔁 Pending payment detected. Attempting to finalize appointment (no origin check).");

      // Mark payment SUCCESS and try to update existing appointment first
      payment.status = "SUCCESS";
      payment.updatedAt = new Date();
      await payment.save();

      try {
        const appointmentServiceBase = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5002";
        const bd = payment.bookingDetails || {};
        const doc = bd.doctor || {};

        const appointmentPayload = {
          appointmentId: payment.appointmentId || `APT_${Date.now()}`,
          patientId: payment.patientId,
          doctorId: payment.doctorId,
          doctorName: doc.fullName || doc.name || doc.displayName || "",
          doctorSpecialty: doc.specialization || doc.specialty || "",
          hospital: doc.baseHospital || doc.hospital || "",
          appointmentDate: bd.selectedDate || bd.appointmentDate || "",
          appointmentTime: bd.selectedTime || bd.appointmentTime || bd.startTime || "",
          startTime: bd.selectedTime || bd.startTime || "",
          duration: bd.duration || bd.selectedConsultation?.duration || 30,
          consultationType: bd.selectedConsultation?.type || bd.selectedConsultation || "Consultation",
          amount: payment.amount || 0,
          paymentId: payment._id.toString()
        };

        // Try to update an existing appointment via payment endpoint
        try {
          const targetId = payment.appointmentId || appointmentPayload.appointmentId;
          const updateResp = await axios.put(`${appointmentServiceBase}/api/appointments/${encodeURIComponent(targetId)}/payment`, {}, { headers: { "Content-Type": "application/json" }, timeout: 8000 });
          console.log("✅ (fallback) Appointment updated via payment endpoint:", updateResp.data);
          if (updateResp.data && (updateResp.data._id || updateResp.data.appointmentId)) {
            payment.appointmentId = updateResp.data.appointmentId || payment.appointmentId;
            await payment.save();
          }
        } catch (updateErr) {
          console.warn("⚠️ (fallback) Could not update appointment, creating a new one:", updateErr?.response?.data || updateErr.message || updateErr);
          // Create appointment via Appointment Service
          const resp = await axios.post(`${appointmentServiceBase}/api/appointments`, appointmentPayload, { headers: { "Content-Type": "application/json" }, timeout: 10000 });
          console.log("✅ (fallback) Appointment created:", resp.data);
          if (resp.data && (resp.data._id || resp.data.appointmentId)) {
            payment.appointmentId = resp.data.appointmentId || payment.appointmentId;
            await payment.save();
          }
        }
      } catch (err) {
        console.error("❌ (fallback) Failed to finalize appointment:", err?.response?.data || err.message || err);
      }
    }

    res.json({ success: true, status: payment.status, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Missing appointmentId' });
    }

    const payment = await Payment.findOne({ appointmentId });
    if (!payment) {
      return res.json({ success: true, exists: false });
    }

    return res.json({ success: true, exists: true, status: payment.status, payment });
  } catch (error) {
    console.error('❌ getPaymentByAppointment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};