const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");
// Ensure you have multer middleware for file uploads
const upload = require("../middleware/uploadMiddleware");

// --- EXISTING ROUTES ---
router.post("/create", upload.array("images"), tripController.createTrip);
router.get("/", tripController.getAllTrips);
router.get("/:id", tripController.getTripById);

// --- 🔴 THE FIX: ADD '/update/' BEFORE ':id' ---
// Your frontend is calling /update/ID, so the route must match exactly.
router.put("/update/:id", upload.array("images"), tripController.updateTrip);

// router.delete("/delete/:id", tripController.deleteTrip); // Optional: if you use /delete/ID

module.exports = router;
