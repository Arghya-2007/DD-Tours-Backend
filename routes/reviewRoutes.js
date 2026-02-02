const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// --- 🛠️ FIX: SMART IMPORT FOR MIDDLEWARE ---
// We try to require the file
const authMiddleware = require("../middleware/authMiddleware");

// We determine which part is the actual function
// 1. Try named exports (authenticateUser, verifyToken, protect)
// 2. Fallback to the default export (authMiddleware)
const protect =
  authMiddleware.authenticateUser ||
  authMiddleware.verifyToken ||
  authMiddleware.protect ||
  authMiddleware;

// --- 🔍 DEBUGGING (Check your server logs if it crashes again) ---
if (typeof protect !== "function") {
  console.error(
    "❌ FATAL ERROR: Auth Middleware is not a function. Received:",
    protect,
  );
}
if (!reviewController || typeof reviewController.createReview !== "function") {
  console.error(
    "❌ FATAL ERROR: Controller 'createReview' is missing. Check reviewController.js exports.",
  );
}

// --- ROUTES ---
router.post("/add", protect, reviewController.createReview);
router.get("/recent", reviewController.getRecentReviews);

module.exports = router;
