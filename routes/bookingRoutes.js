const express = require("express");
const router = express.Router();

// Import Middleware
const { verifyUser, verifyAdmin } = require("../middleware/authMiddleware");

// Import Controllers
const {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  getUserBookings,
} = require("../controllers/bookingController");

// ==========================================
// USER ROUTES (Customers)
// ==========================================

// Create a new booking
// Route: POST /api/bookings/book
router.post("/book", verifyUser, createBooking);

// Route: GET /api/bookings/mine
router.get("/mine", verifyUser, getUserBookings);

// ==========================================
// ADMIN ROUTES (DD Tours Management)
// ==========================================

// Get ALL bookings (Master List)
// Route: GET /api/bookings/all
router.get("/all", verifyAdmin, getAllBookings);

// Approve or Reject a booking
// Route: PUT /api/bookings/status/:id
router.put("/status/:id", verifyAdmin, updateBookingStatus);

module.exports = router;
