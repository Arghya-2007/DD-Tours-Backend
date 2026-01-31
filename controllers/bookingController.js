// controllers/bookingController.js
const { db } = require("../config/firebase");

// ==========================================
// 1. CREATE BOOKING (User)
// ==========================================
const createBooking = async (req, res) => {
  try {
    const uid = req.user.uid; // Secured by verifyUser middleware
    const { tripId, seats, userDetails } = req.body;

    if (!tripId || !seats) {
      return res
        .status(400)
        .json({ message: "Trip ID and Number of Seats are required." });
    }

    // 1. Fetch Trip details to ensure it exists and get valid Price
    const tripRef = db.collection("trips").doc(tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      return res.status(404).json({ message: "Trip not found." });
    }

    const tripData = tripDoc.data();

    // 2. Calculate Total Price (Server-side calculation is safer)
    const pricePerPerson = Number(tripData.price);
    const totalAmount = pricePerPerson * Number(seats);

    // 3. Construct Booking Object
    const newBooking = {
      userId: uid,
      tripId: tripId,
      tripTitle: tripData.title, // Snapshot title in case it changes later
      tripDate: tripData.expectedDate || "TBD",
      seats: Number(seats),
      totalPrice: totalAmount,
      userDetails: userDetails || {}, // Name, Phone sent from frontend form
      status: "pending", // Default status
      createdAt: new Date().toISOString(),
    };

    // 4. Save to 'bookings' collection
    const docRef = await db.collection("bookings").add(newBooking);

    res.status(201).json({
      message: "Booking created successfully!",
      id: docRef.id,
      data: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

// ==========================================
// 2. GET MY BOOKINGS (User)
// ==========================================
const getUserBookings = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Query: "Select * from bookings where userId == [current_user]"
    const snapshot = await db
      .collection("bookings")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc") // Show newest first
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// ==========================================
// 3. GET ALL BOOKINGS (Admin)
// ==========================================
const getAllBookings = async (req, res) => {
  try {
    const snapshot = await db
      .collection("bookings")
      .orderBy("createdAt", "desc")
      .get();

    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({
      message: "Failed to fetch all bookings",
      error: error.message,
    });
  }
};

// ==========================================
// 4. UPDATE BOOKING STATUS (Admin)
// ==========================================
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g., "confirmed", "cancelled"

    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }

    const bookingRef = db.collection("bookings").doc(id);
    const doc = await bookingRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Booking not found." });
    }

    await bookingRef.update({ status });

    res.status(200).json({
      message: `Booking status updated to ${status}`,
      id: id,
      status: status,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({
      message: "Failed to update status",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
};
