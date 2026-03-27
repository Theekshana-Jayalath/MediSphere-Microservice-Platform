import Payment from "../models/paymentModel.js";

export const createPayment = async (req, res) => {
  try {
    const { appointmentId, patientId, amount } = req.body;

    const payment = await Payment.create({
      appointmentId,
      patientId,
      amount
    });

    res.status(201).json({
      message: "Payment initialized",
      payment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};