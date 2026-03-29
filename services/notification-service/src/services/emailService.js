import nodemailer from "nodemailer";

export const sendTelemedicineConfirmationEmail = async ({
  patientEmail,
  patientName,
  doctorName,
  specialty,
  scheduledTime,
  meetingLink,
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const formattedTime = new Date(scheduledTime).toLocaleString();

  const subject = "Your telemedicine appointment is confirmed";

  const html = `
  <div style="font-family: Arial; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px;">
      
      <h2 style="color: #2c3e50;">Telemedicine Appointment Confirmed</h2>

      <p>Hello <b>${patientName}</b>,</p>

      <p>Your telemedicine session has been <b style="color:green;">confirmed</b>.</p>

      <hr/>

      <p><b>Doctor:</b> ${doctorName}</p>
      <p><b>Specialty:</b> ${specialty}</p>
      <p><b>Date & Time:</b> ${formattedTime}</p>

      <div style="margin: 20px 0;">
        <a href="${meetingLink}" 
          style="background-color: #3498db; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px;">
          Join Consultation
        </a>
      </div>

      <p>Please join at your scheduled time.</p>

      <hr/>

      <p style="font-size: 12px; color: gray;">
        MediSphere Telemedicine Service
      </p>
    </div>
  </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject,
    html, // 👈 use HTML
  };

  return await transporter.sendMail(mailOptions);
};