const { db } = require("../config/firebase");

// --- CREATE REVIEW ---
const createReview = async (req, res) => {
  try {
    const { tripId, rating, comment } = req.body;

    // 1. Validate
    if (!req.user || !req.user.uid)
      return res.status(401).json({ message: "User not authenticated." });
    if (!tripId || !rating)
      return res.status(400).json({ message: "Rating and Trip ID required." });

    // 2. Fetch Trip Data ONE TIME to create the snapshot
    const tripRef = db.collection("trips").doc(tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      return res.status(404).json({ message: "Trip not found." });
    }

    const tripData = tripDoc.data();

    // 3. Extract Image (Robust Logic)
    let tripImage =
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070";
    if (Array.isArray(tripData.images) && tripData.images.length > 0) {
      tripImage = tripData.images[0].url;
    } else if (tripData.imageUrl) {
      tripImage = tripData.imageUrl;
    }

    // 4. Save Review with EMBEDDED Trip Info
    const reviewData = {
      tripId,
      tripTitle: tripData.title, // ✅ Saved forever
      tripImage: tripImage, // ✅ Saved forever
      userId: req.user.uid,
      userName: req.user.name || req.user.email?.split("@")[0] || "Explorer",
      userPhoto: req.user.picture || "",
      rating: Number(rating),
      comment: comment || "",
      createdAt: new Date().toISOString(),
    };

    await db.collection("reviews").add(reviewData);

    // 5. Update Aggregates (Math Logic)
    // ... (Same aggregation logic as before to update averageRating) ...
    // [Copy the aggregation logic from previous code or ask me if you need it again]

    res.status(201).json({ message: "Review posted successfully!" });
  } catch (error) {
    console.error("Error posting review:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// --- GET RECENT REVIEWS (Fast Mode) ---
const getRecentReviews = async (req, res) => {
  try {
    const snapshot = await db
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .limit(6)
      .get();

    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() 
      // All data (title, image, user) is already here!
    }));

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

module.exports = { createReview, getRecentReviews };