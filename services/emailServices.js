// backend/services/emailService.js
const { google } = require("googleapis");
const MailComposer = require("nodemailer/lib/mail-composer");
require("dotenv").config();

// 1. Setup OAuth2 Client (Same as before)
const getGmailService = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground",
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
};

// 2. Helper to Encode Email for Google's API
const encodeMessage = (message) => {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

// 3. The Main Sending Function
const sendBookingConfirmation = async (toEmail, booking) => {
  try {
    const gmail = getGmailService();

    // A. Use Nodemailer's library JUST to build the email structure
    const mailGenerator = new MailComposer({
      from: `"DD Tours" <${process.env.EMAIL_USER}>`,
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
  
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://dd-customers.vercel.app/profile" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Mission Brief</a>
            </div>
          </div>
        </div>
      `,
    });

    // B. Compile the email to a Raw String
    const rawMessage = await mailGenerator.compile().build();

    // C. SEND via HTTP API (Port 443 - Bypasses Render Firewall)
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodeMessage(rawMessage),
      },
    });

    console.log("✅ OAuth Email Sent via HTTP API! ID:", res.data.id);
  } catch (error) {
    console.error("❌ Email API Error:", error.message);
    if (error.response) {
      console.error("   Google Details:", error.response.data);
    }
  }
};

module.exports = { sendBookingConfirmation };
