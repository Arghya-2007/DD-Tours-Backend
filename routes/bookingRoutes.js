// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();

// Middleware
const { verifyUser, verifyAdmin } = require("../middleware/authMiddleware");

// Controller
const {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");

// --- CUSTOMER ROUTES ---

// POST /api/bookings/book
// Creates a booking. Requires Login.
router.post("/book", verifyUser, createBooking);

// GET /api/bookings/mine
// Gets logged-in user's history. Requires Login.
router.get("/mine", verifyUser, getUserBookings);

// --- ADMIN ROUTES ---

// GET /api/bookings/all
// Gets master list of bookings. Requires Admin Token.
router.get("/all", verifyAdmin, getAllBookings);

// PUT /api/bookings/status/:id
// Updates booking status (Approved/Rejected). Requires Admin Token.
router.put("/status/:id", verifyAdmin, updateBookingStatus);

module.exports = router;
