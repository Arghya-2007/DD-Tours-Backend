const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// 🔴 CHANGE THIS LINE:
// Remove { } if your middleware is exported directly
// Also, verify the file name is actually "authMiddleware.js"
const authenticateUser = require("../middleware/authMiddleware");

// Debugging: This will print to your console if they are still undefined
if (!authenticateUser)
  console.error("❌ Error: 'authenticateUser' is undefined.");
if (!reviewController.createReview)
  console.error("❌ Error: 'createReview' is undefined.");

// POST /api/v1/reviews/add
router.post("/add", authenticateUser, reviewController.createReview);

module.exports = router;
