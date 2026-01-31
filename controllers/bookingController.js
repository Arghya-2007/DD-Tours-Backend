// Import the initialized Firestore instance
// Make sure this points to where you initialized 'admin.firestore()'
const { db } = require("../config/firebase");

// ==========================================
// 1. CREATE BOOKING
// ==========================================
const createBooking = async (req, res, next) => {
  try {
    // We create a reference to the 'bookings' collection
    // Note: Firebase generates the ID automatically with .add()

    const bookingData = {
      ...req.body,
      // Store the User ID from the token so we know who booked it
      // Firebase Auth tokens usually store the ID in 'uid'
      userId: req.user.uid,
      createdAt: new Date().toISOString(),
      status: "pending", // Default status
    };

    const docRef = await db.collection("bookings").add(bookingData);

    res.status(201).json({
      success: true,
      message: "Tour booked successfully!",
      id: docRef.id, // Return the Firestore generated ID
      data: bookingData,
    });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create booking",
        error: err.message,
      });
  }
};

// ==========================================
// 2. GET USER BOOKINGS (SECURE)
// ==========================================
const getUserBookings = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Query Firestore: "Select * from bookings where userId == [current_user]"
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("userId", "==", userId)
      .get();

    // Map through the docs to create a clean array
    const bookings = [];
    bookingsSnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch bookings",
        error: err.message,
      });
  }
};

// ==========================================
// 3. GET ALL BOOKINGS (ADMIN ONLY)
// ==========================================
const getAllBookings = async (req, res, next) => {
  try {
    const bookingsSnapshot = await db.collection("bookings").get();

    const bookings = [];
    bookingsSnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch all bookings",
        error: err.message,
      });
  }
};

// ==========================================
// 4. UPDATE BOOKING STATUS (ADMIN ONLY)
// ==========================================
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g., "Approved"

    // Reference the specific document
    const bookingRef = db.collection("bookings").doc(id);

    // Check if it exists first
    const doc = await bookingRef.get();
    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Update only the status field
    await bookingRef.update({ status: status });

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      // We return the ID and the new status
      data: { id, status },
    });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update status",
        error: err.message,
      });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
};
