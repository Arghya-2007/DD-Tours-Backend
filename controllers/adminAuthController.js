const jwt = require("jsonwebtoken");

const adminLogin = (req, res) => {
  const { email, password } = req.body;

  // 1. Load credentials from .env
  const allowedEmails = process.env.ADMIN_EMAILS.split(",");
  const adminPassword = process.env.ADMIN_PASSWORD;

  // 2. Check Credentials
  if (!allowedEmails.includes(email)) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Email not recognized." });
  }

  if (password !== adminPassword) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Incorrect password." });
  }

  // 3. Generate JWT Token
  // This token acts as your "Digital ID Card" valid for 24 hours
  const token = jwt.sign(
    { email: email, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  // 4. Send success response
  res.status(200).json({
    message: "Admin Access Granted",
    token: token,
    adminEmail: email,
  });
};

module.exports = { adminLogin };
