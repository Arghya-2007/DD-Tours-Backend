// middleware/authMiddleware.js
const jwt = require("jsonwebtoken"); // For Admins
const { admin } = require("../config/firebase"); // For Users (FIXED IMPORT)

// ==========================================
// 1. VERIFY USER (Firebase Token from Google)
// ==========================================
const verifyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Debugging (Optional, remove later)
    // console.log("🔹 [Auth Debug] Checking User Token...");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access Denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    // ✅ VERIFY WITH FIREBASE (Fixes "admin is not defined")
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken; // Contains uid, email, picture
    next();
  } catch (error) {
    console.error("❌ User Verification Failed:", error.message);
    res
      .status(401)
      .json({ message: "Invalid User Token", error: error.message });
  }
};

// ==========================================
// 2. VERIFY ADMIN (Custom JWT from your Server)
// ==========================================
const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access Denied: No Token Provided" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ VERIFY WITH YOUR SECRET KEY
    // Make sure JWT_SECRET is set in your .env file!
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check Role
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Not an Admin" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Admin Verification Failed:", error.message);
    return res.status(403).json({ message: "Invalid or Expired Admin Token" });
  }
};

module.exports = { verifyAdmin, verifyUser, authenticateUser };
