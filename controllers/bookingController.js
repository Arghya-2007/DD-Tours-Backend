// controllers/bookingController.js
const { db } = require("../config/firebase");

// ==========================================
// 1. CREATE BOOKING (User - Offline / Pay on Arrival)
// ==========================================
const createBooking = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { tripId, seats, userDetails } = req.body;

    if (!tripId || !seats) {
      return res
        .status(400)
        .json({ message: "Trip ID and Number of Seats are required." });
    }

    // 1. Fetch Trip details
    const tripRef = db.collection("trips").doc(tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      return res.status(404).json({ message: "Trip not found." });
    }

    const tripData = tripDoc.data();

    // 2. Calculate Total Price
    const pricePerPerson = Number(tripData.price);
    const totalAmount = pricePerPerson * Number(seats);

    // 3. Determine Date & Fix Status
    // Priority: Fixed Date > Expected Month > TBD
    let finalDate = "TBD";
    let isFixed = false;

    if (tripData.fixedDate) {
      finalDate = tripData.fixedDate;
      isFixed = true;
    } else if (tripData.expectedMonth) {
      finalDate = tripData.expectedMonth;
      isFixed = false;
    }

    // 4. Construct Booking Object (STANDARDIZED SCHEMA)
    // Now matches exactly what Razorpay/Online flow saves
    const newBooking = {
      userId: uid,
      tripId: tripId,
      tripTitle: tripData.title,

      // Standardized Fields
      bookingDate: finalDate, // Was 'tripDate'
      totalAmount: totalAmount, // Was 'totalPrice'
      isFixedDate: isFixed, // New Field for Logic

      seats: Number(seats),
      userDetails: userDetails || {},
      status: "pending",
      paymentMethod: "pay_on_arrival",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    // 5. Save
    const docRef = await db.collection("bookings").add(newBooking);

    res.status(201).json({
      message: "Booking created successfully!",
      bookingId: docRef.id,
      ...newBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res
      .status(500)
      .json({ message: "Failed to create booking", error: error.message });
  }
};

// ==========================================
// 2. GET MY BOOKINGS (User - With Live Trip Sync)
// ==========================================
const getUserBookings = async (req, res) => {
  try {
    // Assuming you have middleware that adds user ID to req.user
    const userId = req.user.uid;

    // 1. Fetch all bookings for this user
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    if (bookingsSnapshot.empty) {
      return res.status(200).json([]);
    }

    // 2. "Hydrate" the bookings with LIVE Trip Data
    // We map over the bookings and fetch the corresponding Trip document for each one.
    const bookingPromises = bookingsSnapshot.docs.map(async (doc) => {
      const bookingData = doc.data();

      let liveTripDetails = {};

      // If the booking has a tripId, fetch the latest data from 'trips' collection
      if (bookingData.tripId) {
        try {
          const tripDoc = await db
            .collection("trips")
            .doc(bookingData.tripId)
            .get();
          if (tripDoc.exists) {
            liveTripDetails = tripDoc.data();
          }
        } catch (err) {
          console.warn(
            `Failed to fetch trip details for booking ${doc.id}`,
            err,
          );
        }
      }

      // 3. Construct the response
      return {
        id: doc.id,
        ...bookingData,
        // We embed the LIVE trip object here.
        // This ensures the frontend gets the CURRENT status, not the old one.
        trip: {
          title: liveTripDetails.title || bookingData.tripTitle,
          status: liveTripDetails.status || "upcoming", // <--- THIS IS WHAT YOU NEED
          fixedDate: liveTripDetails.fixedDate,
          bookingDeadline: liveTripDetails.bookingDeadline,
        },
      };
    });

    // Wait for all the parallel fetches to complete
    const hydratedBookings = await Promise.all(bookingPromises);

    res.status(200).json(hydratedBookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
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
      // Basic normalization for Admin view as well
      const data = doc.data();
      bookings.push({
        id: doc.id,
        ...data,
        totalAmount: data.totalAmount || data.totalPrice, // Normalize for Admin UI
        bookingDate: data.bookingDate || data.tripDate, // Normalize for Admin UI
      });
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch all bookings", error: error.message });
  }
};

// ==========================================
// 4. UPDATE BOOKING STATUS (Admin)
// ==========================================
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status)
      return res.status(400).json({ message: "Status is required." });

    const bookingRef = db.collection("bookings").doc(id);
    const doc = await bookingRef.get();

    if (!doc.exists)
      return res.status(404).json({ message: "Booking not found." });

    await bookingRef.update({ status });

    res.status(200).json({
      message: `Booking status updated to ${status}`,
      id: id,
      status: status,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res
      .status(500)
      .json({ message: "Failed to update status", error: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
};
