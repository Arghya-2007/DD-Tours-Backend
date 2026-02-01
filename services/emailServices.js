const nodemailer = require("nodemailer");
const { google } = require("googleapis"); // You might need: npm install googleapis

// Create the transporter ONCE (More efficient)
const createTransporter = async () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground",
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  // Get a fresh Access Token automatically
  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.error("❌ Google OAuth Failed to Refresh Token:", err);
        reject("Failed to create access token");
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      accessToken,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

  return transporter;
};

const sendBookingConfirmation = async (toEmail, booking) => {
  if (!toEmail) return;

  try {
    const transporter = await createTransporter();

    const mailOptions = {
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
              <p style="margin: 5px 0;"><strong>Total Paid:</strong> ₹${Number(booking.amount).toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Transaction ID:</strong> <span style="font-family: monospace;">${booking.paymentId}</span></p>
            </div>
  
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://dd-customers.vercel.app/profile" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Mission Brief</a>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OAuth Email Sent! ID:", info.messageId);
  } catch (error) {
    console.error("❌ Email Error:", error);
  }
};

module.exports = { sendBookingConfirmation };
