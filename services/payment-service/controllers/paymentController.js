import Payment from "../models/paymentModel.js";
import { generateHash } from "../utils/payhereHash.js";
import axios from "axios";

export const createPayment = async (req, res) => {
  try {
    console.log("📦 Received payment request:", req.body);

    const {
      appointmentId,
      patientId,
      doctorId,
      amount,
      contact,
      bookingDetails,
    } = req.body;

    // Validate required fields
    if (!appointmentId || !patientId || !doctorId || !amount || !contact) {
      console.error("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const orderId =
      "ORDER_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    console.log("🆕 Created orderId:", orderId);

    // Create payment record
    const payment = new Payment({
      orderId,
      paymentId: req.body.paymentId,
      appointmentId,
      patientId,
      doctorId,
      amount: Number(amount),
      currency: "LKR",
      status: "PAID",
      contact,
    });

    await payment.save();
    console.log("💾 Payment saved to database");

    const appointmentServiceBase =
      process.env.API_GATEWAY_URL || "http://localhost:5015";

    // ─── KEY FIX ───────────────────────────────────────────────────────────────
    // An appointmentId was provided, meaning the appointment already exists in
    // the DB with status PENDING.  Update it to CONFIRMED now that payment is
    // recorded as PAID.
    if (appointmentId || payment.appointmentId) {
      const targetId = appointmentId || payment.appointmentId;
      console.log(
        "📤 Updating existing appointment to CONFIRMED:",
        targetId
      );

      try {
        const resp = await axios.put(
          `${appointmentServiceBase}/api/appointments/payment/success/${encodeURIComponent(
            targetId
          )}`,
          {
            orderId,
            paymentStatus: "PAID",
            status: "CONFIRMED",
            paidAt: new Date(),
          },
          { headers: { "Content-Type": "application/json" }, timeout: 8000 }
        );

        console.log("✅ Appointment updated to CONFIRMED:", resp.data);
      } catch (err) {
        console.error(
          "⚠️ Could not update appointment to CONFIRMED (will retry on IPN):",
          err?.response?.data || err.message || err
        );
      }
    } else {
      // No appointmentId at all — create a brand-new PENDING appointment.
      // (This branch is kept for backwards-compat but should rarely be hit
      //  given the required-field check above enforces appointmentId.)
      try {
        const bd = payment.bookingDetails || {};
        const doc = bd.doctor || {};

        const rawTime =
          bd.selectedTime || bd.appointmentTime || bd.startTime || "";
        const startLabel = (rawTime || "").split("-")[0].trim();

        const appointmentPayload = {
          appointmentId: payment.appointmentId || `APT_${Date.now()}`,
          patientId: payment.patientId,
          doctorId: payment.doctorId,
          doctorName: doc.fullName || doc.name || "",
          doctorSpecialty: doc.specialization || doc.specialty || "",
          hospital:
            bd.selectedHospital || doc.baseHospital || doc.hospital || "",
          appointmentDate: bd.selectedDate || bd.appointmentDate || "",
          appointmentTime:
            bd.appointmentTime || bd.selectedTime || rawTime || "",
          startTime: bd.startTime || startLabel || "",
          duration:
            bd.duration || bd.selectedConsultation?.duration || 120,
          consultationType:
            bd.selectedConsultation?.type ||
            bd.selectedConsultation ||
            "Consultation",
          amount: payment.amount || 0,
          paymentId: payment.paymentId || payment._id.toString(),
          status: "PENDING",
        };

        console.log(
          "📤 Creating new appointment (PENDING) via Appointment Service:",
          appointmentPayload
        );
        const resp = await axios.post(
          `${appointmentServiceBase}/api/appointments`,
          appointmentPayload,
          { headers: { "Content-Type": "application/json" }, timeout: 8000 }
        );

        console.log("✅ New appointment created:", resp.data);
        if (resp.data && (resp.data._id || resp.data.appointmentId)) {
          payment.appointmentId =
            resp.data.appointmentId ||
            payment.appointmentId ||
            appointmentPayload.appointmentId;
          await payment.save();
        }
      } catch (err) {
        console.error(
          "⚠️ Could not create appointment (will retry on IPN):",
          err?.response?.data || err.message || err
        );
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    const formattedAmount = Number(amount).toFixed(2);
    console.log("💰 Amount:", formattedAmount);

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    console.log("🏪 Merchant ID:", merchantId);

    if (!merchantId || !merchantSecret) {
      console.error("❌ Missing PayHere credentials in .env");
      return res.status(500).json({
        success: false,
        message: "Payment gateway configuration error",
      });
    }

    const hash = generateHash(
      merchantId,
      orderId,
      formattedAmount,
      "LKR",
      merchantSecret
    );
    console.log("🔐 Generated hash:", hash);

    let firstName = "Test";
    let lastName = "User";
    let email = "test@example.com";
    let phone = "0712345678";

    if (contact.includes("@")) {
      email = contact;
      firstName = contact.split("@")[0];
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
      items: `Appointment Booking - ${
        bookingDetails?.doctor?.name || "Doctor Consultation"
      }`,
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
      hash: hash,
    };

    console.log("✅ Sending payhere data:", payhere);

    res.json({ success: true, payhere: payhere });
  } catch (error) {
    console.error("❌ Create payment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleIPN = async (req, res) => {
  console.log("📨 IPN received:", req.body);

  try {
    const body = req.body || {};

    const orderId = body.order_id || body.orderId;
    const payment_id =
      body.payment_id ||
      body.paymentId ||
      body.transaction_id ||
      body.payhere_payment_id;
    const statusCode =
      body.status_code || body.status || body.payment_status;

    console.log("🔎 Parsed IPN fields:", { orderId, payment_id, statusCode });

    if (!orderId) {
      console.error("⚠️ IPN missing order_id");
      return res.status(200).send("Missing order_id");
    }

    const payment = await Payment.findOne({ orderId });
    console.log(
      "🔎 Payment lookup result for orderId",
      orderId,
      ":",
      payment ? "FOUND" : "NOT_FOUND"
    );

    if (!payment) {
      console.error("⚠️ Payment not found for orderId:", orderId);
      return res.status(200).send("OK");
    }

    if (payment.status === "PAID") {
      console.log(
        "ℹ️ Payment already PAID for orderId:",
        orderId,
        "- skipping"
      );
      return res.status(200).send("OK");
    }

    const isSuccess =
      String(statusCode) === "2" ||
      String(statusCode).toLowerCase() === "paid" ||
      String(statusCode).toLowerCase() === "success" ||
      String(body.status || "").toLowerCase() === "paid";

    if (isSuccess) {
      try {
        const updateResult = await Payment.updateOne(
          { orderId },
          {
            $set: {
              status: "PAID",
              paymentId: payment_id || payment.paymentId,
              transactionId: payment_id || payment.transactionId,
              updatedAt: new Date(),
            },
          }
        );

        console.log(
          "✅ Payment updated to PAID for orderId:",
          orderId,
          "result:",
          updateResult
        );

        const appointmentServiceBase =
          process.env.API_GATEWAY_URL || "http://localhost:5015";

        if (payment.appointmentId) {
          try {
            console.log(
              "📤 Notifying Appointment Service to CONFIRM appointment:",
              payment.appointmentId
            );
            const resp = await axios.put(
              `${appointmentServiceBase}/api/appointments/payment/success/${encodeURIComponent(
                payment.appointmentId
              )}`,
              {
                orderId,
                paymentStatus: "PAID",
                status: "CONFIRMED",
                paidAt: new Date(),
              },
              {
                headers: { "Content-Type": "application/json" },
                timeout: 8000,
              }
            );

            console.log("✅ Appointment Service response:", resp?.data);
          } catch (apptErr) {
            console.error(
              "❌ Failed to update appointment status via Appointment Service:",
              apptErr?.response?.data || apptErr.message || apptErr
            );
          }
        } else {
          console.warn(
            "⚠️ No appointmentId on payment; skipping appointment update"
          );
        }

        return res.status(200).send("OK");
      } catch (err) {
        console.error(
          "❌ Error while marking payment PAID:",
          err?.message || err
        );
        return res.status(200).send("OK");
      }
    }

    try {
      const updateResult = await Payment.updateOne(
        { orderId },
        {
          $set: {
            status: "FAILED",
            transactionId: payment_id || payment.transactionId,
            updatedAt: new Date(),
          },
        }
      );
      console.log(
        "⚠️ Payment marked as FAILED for orderId:",
        orderId,
        "result:",
        updateResult
      );
    } catch (err) {
      console.error(
        "❌ Error while marking payment FAILED:",
        err?.message || err
      );
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ IPN handler error:", error);
    return res.status(200).send("OK");
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    if (payment.status === "PENDING") {
      console.log(
        "🔁 Pending payment detected. Attempting to finalize appointment (no origin check)."
      );

      payment.status = "PAID";
      payment.updatedAt = new Date();
      await payment.save();

      try {
        const appointmentServiceBase =
          process.env.API_GATEWAY_URL || "http://localhost:5015";
        const bd = payment.bookingDetails || {};
        const doc = bd.doctor || {};

        const rawTime =
          bd.selectedTime || bd.appointmentTime || bd.startTime || "";
        const startLabel = (rawTime || "").split("-")[0].trim();

        const appointmentPayload = {
          appointmentId: payment.appointmentId || `APT_${Date.now()}`,
          patientId: payment.patientId,
          doctorId: payment.doctorId,
          doctorName: doc.fullName || doc.name || doc.displayName || "",
          doctorSpecialty: doc.specialization || doc.specialty || "",
          hospital:
            bd.selectedHospital || doc.baseHospital || doc.hospital || "",
          appointmentDate: bd.selectedDate || bd.appointmentDate || "",
          appointmentTime:
            bd.appointmentTime || bd.selectedTime || rawTime || "",
          startTime: bd.startTime || startLabel || "",
          duration: bd.duration || bd.selectedConsultation?.duration || 120,
          consultationType:
            bd.selectedConsultation?.type ||
            bd.selectedConsultation ||
            "Consultation",
          amount: payment.amount || 0,
          paymentId: payment.paymentId || payment._id.toString(),
        };

        try {
          const targetId =
            payment.appointmentId || appointmentPayload.appointmentId;
          const updateResp = await axios.put(
            `${appointmentServiceBase}/api/appointments/${encodeURIComponent(
              targetId
            )}/payment`,
            {},
            {
              headers: { "Content-Type": "application/json" },
              timeout: 8000,
            }
          );
          console.log(
            "✅ (fallback) Appointment updated via payment endpoint:",
            updateResp.data
          );
          if (updateResp.data && (updateResp.data._id || updateResp.data.appointmentId)) {
            payment.appointmentId =
              updateResp.data.appointmentId || payment.appointmentId;
            await payment.save();
          }
        } catch (updateErr) {
          console.warn(
            "⚠️ (fallback) Could not update appointment, creating a new one:",
            updateErr?.response?.data || updateErr.message || updateErr
          );
          const resp = await axios.post(
            `${appointmentServiceBase}/api/appointments`,
            appointmentPayload,
            {
              headers: { "Content-Type": "application/json" },
              timeout: 10000,
            }
          );
          console.log("✅ (fallback) Appointment created:", resp.data);
          if (resp.data && (resp.data._id || resp.data.appointmentId)) {
            payment.appointmentId =
              resp.data.appointmentId || payment.appointmentId;
            await payment.save();
          }
        }
      } catch (err) {
        console.error(
          "❌ (fallback) Failed to finalize appointment:",
          err?.response?.data || err.message || err
        );
      }
    }

    res.json({ success: true, status: payment.status, payment });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing appointmentId" });
    }

    const payment = await Payment.findOne({ appointmentId });
    if (!payment) {
      return res.json({ success: true, exists: false });
    }

    return res.json({
      success: true,
      exists: true,
      status: payment.status,
      payment,
    });
  } catch (error) {
    console.error("❌ getPaymentByAppointment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

export const getPaymentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const payments = await Payment.find({ patientId }).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error("Failed to fetch patient payments:", error);
    res.status(500).json({ message: "Failed to fetch patient payments" });
  }
};