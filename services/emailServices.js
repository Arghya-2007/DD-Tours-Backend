// backend/services/emailService.js
const nodemailer = require("nodemailer");

// 👇 UPDATED TRANSPORTER CONFIGURATION
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Explicit Host
  port: 587, // Explicit Port (Standard for Cloud)
  secure: false, // Must be false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // 🛡️ Extra fix for cloud environments
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
  // ⏱️ Increase timeout to prevent early disconnects
  connectionTimeout: 10000,
});

const sendBookingConfirmation = async (toEmail, booking) => {
  if (!toEmail) {
    console.log("❌ No email provided for notification.");
    return;
  }

  const mailOptions = {
    from: `"DD Tours & Travels" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🏔️ Mission Confirmed: ${booking.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #ea580c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">MISSION CONFIRMED</h1>
        </div>
        <div style="padding: 20px; color: #333;">
          <p style="font-size: 16px;">Hi <strong>${booking.name}</strong>,</p>
          <p>Your expedition is officially secured. Pack your bags!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Trip:</strong> ${booking.title}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Seats:</strong> ${booking.seats}</p>
            <p style="margin: 5px 0;"><strong>Total Paid:</strong> ₹${Number(booking.amount).toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Transaction ID:</strong> <span style="font-family: monospace;">${booking.paymentId}</span></p>
          </div>

          <p>You can view your full itinerary and download your pass in your profile.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://dd-customers.vercel.app/profile" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Mission Brief</a>
          </div>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; ${new Date().getFullYear()} DD Tours & Travels. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("📧 Confirmation Email Sent to:", toEmail);
  } catch (error) {
    console.error("❌ Email Failed:", error.message);
    // Note: We do NOT throw the error here so the booking doesn't fail
    // just because the email failed.
  }
};

module.exports = { sendBookingConfirmation };
