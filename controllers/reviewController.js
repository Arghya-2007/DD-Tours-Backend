const { db } = require("../config/firebase");

// --- CREATE REVIEW ---
const createReview = async (req, res) => {
  try {
    console.log("📝 [Review Debug] Incoming Review Payload:", req.body);

    const { tripId, rating, comment } = req.body;

    // 1. Safety Checks
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ message: "User not authenticated." });
    }
    if (!tripId) {
      return res.status(400).json({ message: "Trip ID is missing." });
    }
    if (!rating) {
      return res.status(400).json({ message: "Rating is required." });
    }

    // 2. Verify Trip Exists BEFORE saving review
    const tripRef = db.collection("trips").doc(tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      console.error(
        `❌ [Review Debug] Trip ID ${tripId} not found in database.`,
      );
      return res
        .status(404)
        .json({ message: "Trip not found. Cannot review." });
    }

    // 3. Prepare User Data (Handle missing names/photos)
    const userId = req.user.uid;
    const userName =
      req.user.name || req.user.email?.split("@")[0] || "Explorer";
    const userPhoto = req.user.picture || "";

    // 4. Save Review
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
    console.log("✅ [Review Debug] Review saved to 'reviews' collection.");

    // 5. AGGREGATION: Recalculate Trip Average
    // We fetch all reviews for this specific trip
    const reviewsSnapshot = await db
      .collection("reviews")
      .where("tripId", "==", tripId)
      .get();

    let totalStars = 0;
    let reviewCount = 0;

    reviewsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rating) {
        totalStars += Number(data.rating);
        reviewCount++;
      }
    });

    const newAverage =
      reviewCount > 0 ? (totalStars / reviewCount).toFixed(1) : 0;
    console.log(
      `📊 [Review Debug] New Stats -> Avg: ${newAverage}, Count: ${reviewCount}`,
    );

    // 6. Update the TRIP Document with new stats
    // We use .set with merge: true to avoid crashes if something is weird
    await tripRef.set(
      {
        averageRating: Number(newAverage),
        totalRatings: reviewCount,
      },
      { merge: true },
    );

    console.log("✅ [Review Debug] Trip stats updated successfully.");

    res.status(201).json({
      message: "Review posted successfully!",
      newAverage: Number(newAverage),
      totalRatings: reviewCount,
    });
  } catch (error) {
    console.error("🔥 [Review Debug] CRITICAL ERROR:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const getRecentReviews = async (req, res) => {
  try {
    const snapshot = await db
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .limit(3) // Fetch top 3 latest reviews
      .get();

    const reviews = [];

    // We need to fetch the Trip Title for each review to give context
    // This uses a parallel fetch pattern for speed
    const reviewPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      let tripTitle = "Unknown Expedition";

      if (data.tripId) {
        const tripDoc = await db.collection("trips").doc(data.tripId).get();
        if (tripDoc.exists) {
          tripTitle = tripDoc.data().title;
        }
      }

      return {
        id: doc.id,
        ...data,
        tripTitle,
      };
    });

    const reviewsWithTitles = await Promise.all(reviewPromises);
    res.status(200).json(reviewsWithTitles);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

module.exports = { createReview, getRecentReviews };