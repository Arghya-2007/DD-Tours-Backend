const { db } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");

// --- 1. SUBMIT REVIEW ---
const createReview = async (req, res) => {
  try {
    const { tripId, rating, comment } = req.body;
    const userId = req.user.uid;
    const userName = req.user.name || "Explorer";
    const userPhoto = req.user.picture || "";

    if (!tripId || !rating) {
      return res.status(400).json({ message: "Rating and Trip ID required." });
    }

    // 1. Save the Review
    const reviewData = {
      tripId,
      userId,
      userName,
      userPhoto,
      rating: Number(rating),
      comment: comment || "",
      createdAt: new Date().toISOString(),
    };

    await db.collection("reviews").add(reviewData);

    // 2. AGGREGATION: Recalculate Trip Average
    // We fetch all reviews for this trip to get the math right
    const reviewsSnapshot = await db
      .collection("reviews")
      .where("tripId", "==", tripId)
      .get();

    let totalStars = 0;
    let reviewCount = 0;

    reviewsSnapshot.forEach((doc) => {
      totalStars += doc.data().rating;
      reviewCount++;
    });

    const newAverage =
      reviewCount > 0 ? (totalStars / reviewCount).toFixed(1) : 0;

    // 3. Update the TRIP Document (This makes the 'All Trips' page fast)
    await db
      .collection("trips")
      .doc(tripId)
      .update({
        averageRating: Number(newAverage),
        totalRatings: reviewCount,
      });

    res.status(201).json({ message: "Review posted!", newAverage });
  } catch (error) {
    console.error("Error posting review:", error);
    res.status(500).json({ message: "Failed to post review" });
  }
};

module.exports = { createReview };
