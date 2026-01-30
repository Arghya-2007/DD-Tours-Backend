// controllers/bookingController.js
const { db } = require("../config/firebase");

// --- 1. CREATE New Booking (User Side) ---
// Handles both Online and Offline payment selection
const createBooking = async (req, res) => {
  console.log("Incoming Headers:", req.headers["content-type"]);
  console.log("Incoming Body:", req.body);
  try {
    const {
      tripId,
      tripTitle,
      tripPrice,
      userId,
      userName,
      userEmail,
      phone,
      travelers,
      date,
      paymentMethod, // 'online' or 'offline'
      transactionId, // Optional: For 'online' manual UPI reference
    } = req.body;

    // Validation: Ensure all critical fields are present
    if (!tripId || !userId || !date || !paymentMethod) {
      return res.status(400).json({
        message:
          "Missing required booking details (Trip, User, Date, or Payment Method)",
      });
    }

    // Calculate total price
    const numTravelers = Number(travelers) || 1;
    const pricePerPerson = Number(tripPrice);
    const totalPrice = pricePerPerson * numTravelers;

    // Initial Payment Status Logic
    // If 'offline', they pay later -> 'pending'
    // If 'online', they might have paid -> 'pending' (until you verify) or 'paid'
    let paymentStatus = "pending";

    const newBooking = {
      tripId,
      tripTitle,
      tripPrice: pricePerPerson,
      totalPrice,
      userId,
      userName,
      userEmail,
      phone,
      travelers: numTravelers,
      date,

      // Payment & Status Info
      paymentMethod, // 'online' | 'offline'
      paymentStatus, // 'pending' | 'paid' | 'failed'
      transactionId: transactionId || "",

      status: "pending", // 'pending' | 'confirmed' | 'cancelled' | 'completed'
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    const docRef = await db.collection("bookings").add(newBooking);

    res.status(201).json({
      message: "Booking request submitted successfully!",
      id: docRef.id,
      booking: newBooking,
    });
  } catch (error) {
    console.error("Booking Error:", error);
    res
      .status(500)
      .json({ message: "Failed to create booking", error: error.message });
  }
};

// --- 2. GET All Bookings (Admin Side) ---
// Returns every booking in the system, sorted by newest first
const getAllBookings = async (req, res) => {
  try {
    const snapshot = await db
      .collection("bookings")
      .orderBy("createdAt", "desc")
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
    console.error("Fetch Error:", error);
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: error.message });
  }
};

// --- 3. UPDATE Booking Status (Admin Side) ---
// Admin can Confirm, Cancel, or Complete a trip
// Can also be used to update Payment Status (e.g., mark as 'paid')
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    // Prepare updates object dynamically
    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No status provided to update" });
    }

    const docRef = db.collection("bookings").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await docRef.update(updates);

    res.status(200).json({
      message: "Booking updated successfully",
      updatedFields: updates,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res
      .status(500)
      .json({ message: "Error updating status", error: error.message });
  }
};

// --- 4. GET User's Bookings (User Side) ---
// Shows only the bookings made by a specific user
const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db
      .collection("bookings")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("User Bookings Error:", error);
    res
      .status(500)
      .json({ message: "Error fetching user bookings", error: error.message });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  getUserBookings,
};
