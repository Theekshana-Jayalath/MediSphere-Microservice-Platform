import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendTelemedicineConfirmationEmail = async ({
  patientEmail,
  patientName,
  doctorName,
  specialty,
  scheduledTime,
  meetingLink,
}) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject: "Appointment Confirmed",
    html: `
      <h2>Appointment Confirmed</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment has been confirmed by the doctor.</p>
      <p><strong>Doctor:</strong> ${doctorName}</p>
      <p><strong>Specialty:</strong> ${specialty || "Not specified"}</p>
      <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
      ${
        meetingLink
          ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>`
          : ""
      }
      <p>MediSphere Team</p>
    `,
  };

  return await transporter.sendMail(mailOptions);
};