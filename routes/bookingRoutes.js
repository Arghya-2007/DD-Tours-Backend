// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const verifyAdmin = require("../middleware/authMiddleware");
const {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  getUserBookings,
} = require("../controllers/bookingController");

// --- User Routes ---
// Ideally, verifyAdmin should be renamed to verifyToken for users,
// but for now, we use it to ensure they are logged in.
router.post("/book", verifyAdmin, createBooking);
router.get("/user/:userId", verifyAdmin, getUserBookings);

// --- Admin Routes ---
router.get("/all", verifyAdmin, getAllBookings);
router.put("/status/:id", verifyAdmin, updateBookingStatus);

module.exports = router;
