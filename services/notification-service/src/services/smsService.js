import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendAppointmentConfirmationSms = async ({
  phoneNumber,
  patientName,
  doctorName,
  scheduledTime,
}) => {
  const message = await client.messages.create({
    body: `Hello ${patientName}, your appointment with Dr. ${doctorName} has been confirmed for ${scheduledTime}.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });

  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
  };
};