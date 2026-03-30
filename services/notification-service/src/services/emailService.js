import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
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
    subject: "Appointment Confirmation",
    html: `
      <h2>Appointment Confirmed</h2>
      <p>Hello ${patientName},</p>
      <p>Your appointment with Dr. ${doctorName} has been confirmed.</p>
      <p><strong>Specialty:</strong> ${specialty}</p>
      <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
      <p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
    `,
  };

  return await transporter.sendMail(mailOptions);
};