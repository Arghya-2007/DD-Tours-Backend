// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();

const { verifyUser, verifyAdmin } = require("../middleware/authMiddleware");

const {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  getUserBookings,
} = require("../controllers/bookingController");

// --- USER ROUTES (Customers) ---
router.post("/book", verifyUser, createBooking);

// Users can only see THEIR OWN bookings
router.get("/user/:userId", verifyUser, getUserBookings);

// --- ADMIN ROUTES (DD Tours Management) ---
router.get("/all", verifyAdmin, getAllBookings);

// Only ADMIN can approve/reject bookings
router.put("/status/:id", verifyAdmin, updateBookingStatus);

module.exports = router;
