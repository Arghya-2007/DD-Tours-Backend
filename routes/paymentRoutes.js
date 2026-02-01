const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const admin = require("firebase-admin");
const router = express.Router();

// --- 1. ROBUST FIREBASE INITIALIZATION ---
// This prevents "App already exists" errors and handles .env newlines correctly
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // CRITICAL FIX: Convert string "\n" in .env to actual line breaks
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined,
      }),
    });
    console.log("🔥 Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Failed:", error);
  }
}

const db = admin.firestore();

// --- 2. RAZORPAY CONFIGURATION ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- ROUTE 1: CREATE ORDER ---
// Call this from frontend to get an Order ID
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    // Razorpay expects amount in 'paise' (INR * 100)
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    res.status(500).send("Error creating order");
  }
});

// --- ROUTE 2: VERIFY PAYMENT & SAVE BOOKING ---
// This is the critical security step
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails,
    } = req.body;

    // 1. Cryptographic Verification
    // We recreate the signature using our Secret Key to ensure data wasn't tampered with
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // ✅ VERIFIED: Payment is Legit

      // 2. Prepare Data for Firestore
      const newBooking = {
        ...bookingDetails, // User Info, Trip Info, Date
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amountPaid: bookingDetails.totalAmount,
        status: "confirmed",
        paymentMethod: "online",
        gateway: "razorpay",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // 3. Save to 'bookings' Collection in Firebase
      const docRef = await db.collection("bookings").add(newBooking);

      console.log("✅ Booking Saved to DB. ID:", docRef.id);

      try {
        const emailData = {
          name: bookingDetails.userDetails?.fullName || "Explorer",
          title: bookingDetails.tripTitle,
          date: bookingDetails.bookingDate,
          seats: bookingDetails.seats,
          amount: bookingDetails.totalAmount,
          paymentId: razorpay_payment_id,
        };

        // We trigger it but don't hold up the response
        sendBookingConfirmation(
          bookingDetails.userDetails?.email || bookingDetails.userEmail,
          emailData,
        );
      } catch (err) {
        console.error("Email trigger failed:", err);
      }

      // 4. Send Success to Frontend
      res.json({
        success: true,
        message: "Payment Verified & Booking Saved",
        bookingId: docRef.id,
      });
    } else {
      // ❌ FAILED: Signature mismatch (Potential Fraud)
      console.error("❌ Invalid Signature");
      res.status(400).json({ success: false, message: "Invalid Signature" });
    }
  } catch (error) {
    console.error("❌ Verification Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;
