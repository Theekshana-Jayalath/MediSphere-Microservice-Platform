import Payment from "../models/paymentModel.js";
import { generateHash } from "../utils/payhereHash.js";

export const createPayment = async (req, res) => {

    const { appointmentId, patientId, doctorId, amount } = req.body;

    const orderId = "ORDER_" + Date.now();

    const payment = new Payment({
        appointmentId,
        orderId,
        patientId,
        doctorId,
        amount,
        currency: "LKR"
    });

    await payment.save();

    const hash = generateHash(
        process.env.PAYHERE_MERCHANT_ID,
        orderId,
        amount,
        "LKR",
        process.env.PAYHERE_MERCHANT_SECRET
    );

    res.json({
        merchant_id: process.env.PAYHERE_MERCHANT_ID,
        order_id: orderId,
        amount,
        currency: "LKR",
        hash
    });
};