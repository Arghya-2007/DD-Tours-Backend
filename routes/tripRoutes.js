const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

// ⚠️ IMPORTANT: Ensure this file exists at src/middleware/uploadMiddleware.js
// If you get "Cannot find module", you need to create this file first.
const upload = require("../middleware/uploadMiddleware");

// ==========================================
// 1. CREATE (POST)
// ==========================================
// URL: /api/v1/trips/create
// Matches: formData.append("images", file) in React
router.post(
  "/create",
  upload.array("images"), // Middleware to handle file uploads
  tripController.createTrip,
);

// ==========================================
// 2. READ (GET)
// ==========================================
// URL: /api/v1/trips
router.get("/", tripController.getAllTrips);

// URL: /api/v1/trips/:id (e.g., /api/v1/trips/abc12345)
router.get("/:id", tripController.getTripById);

// ==========================================
// 3. UPDATE (PUT)
// ==========================================
// URL: /api/v1/trips/update/:id
// Matches your Frontend error: ".../trips/update/iJICh..."
router.put(
  "/update/:id",
  upload.array("images"), // Middleware to handle new images if uploaded
  tripController.updateTrip,
);

// ==========================================
// 4. DELETE (DELETE)
// ==========================================
// URL: /api/v1/trips/delete/:id
// We explicitly add '/delete/' to match your likely Frontend pattern
router.delete("/delete/:id", tripController.deleteTrip);

// Fallback: Also support standard REST delete just in case
// URL: /api/v1/trips/:id
router.delete("/:id", tripController.deleteTrip);

module.exports = router;
