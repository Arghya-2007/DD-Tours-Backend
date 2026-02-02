const jwt = require("jsonwebtoken"); // For Admins
const { admin } = require("../config/firebase"); // For Users

// ==========================================
// 1. VERIFY USER (Firebase Token)
// ==========================================
// This checks if a normal user is logged in via Google/Email
const verifyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access Denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    // ✅ VERIFY WITH FIREBASE
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
// 2. VERIFY ADMIN (Custom JWT)
// ==========================================
// This checks if an Admin is logged in via your Secret Panel
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

// ==========================================
// 3. THE FIX: DEFINE AUTHENTICATE USER
// ==========================================
// We simply point this to verifyUser, since that's what your routes expect.
const authenticateUser = verifyUser;

// Now all 3 names exist, so the export will work!
module.exports = { verifyAdmin, verifyUser, authenticateUser };