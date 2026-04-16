import Payment from "../models/paymentModel.js";
import { generateHash } from "../utils/payhereHash.js";

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
      contact,
      bookingDetails: bookingDetails || {}
    });

    await payment.save();
    console.log("💾 Payment saved to database");

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
  res.sendStatus(200);
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    
    res.json({ success: true, status: payment.status, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};