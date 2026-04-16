import Payment from "../models/paymentModel.js";
import { generateHash } from "../utils/payhereHash.js";

export const createPayment = async (req, res) => {
  const { appointmentId, patientId, doctorId, amount, contact } = req.body;

  const orderId = "ORDER_" + Date.now();

  const payment = new Payment({
    orderId,
    appointmentId,
    patientId,
    doctorId,
    amount,
    currency: "LKR",
    status: "PENDING",
    contact,
  });

  await payment.save();

  const formattedAmount = Number(amount).toFixed(2);

  const hash = generateHash(
    process.env.PAYHERE_MERCHANT_ID,
    orderId,
    formattedAmount,
    "LKR",
    process.env.PAYHERE_MERCHANT_SECRET
  );

  const payhere = {
    merchant_id: process.env.PAYHERE_MERCHANT_ID,
    return_url: process.env.PAYHERE_RETURN_URL,
    cancel_url: process.env.PAYHERE_CANCEL_URL,
    notify_url: process.env.PAYHERE_NOTIFY_URL,
    order_id: orderId,
    items: `Appointment ${orderId}`,
    currency: "LKR",
    amount: formattedAmount,
    first_name: "Patient",
    last_name: "",
    email: contact,
    phone: contact,
    country: "Sri Lanka",
    hash,
  };

  res.json({ payhere });
};

export const handleIPN = async (req, res) => {
  console.log("IPN received", req.body);

  const { order_id, payment_id, status_code } = req.body;

  try {
    const payment = await Payment.findOne({ orderId: order_id });

    if (payment) {
      if (status_code == 2) {
        payment.status = "SUCCESS";
      } else {
        payment.status = "FAILED";
      }

      payment.transactionId = payment_id;
      await payment.save();

      console.log("Payment updated:", order_id);
    }
  } catch (error) {
    console.error(error);
  }

  res.sendStatus(200);
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