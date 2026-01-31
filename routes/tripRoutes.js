// routes/tripRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require("../controllers/tripController");
const verifyAdmin = require("../middleware/authMiddleware");

// Multer Setup (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- PUBLIC ROUTES (No Token Needed) ---
// Anyone can view trips
router.get("/", getAllTrips);
router.get("/:id", getTripById);

// --- SECURE ADMIN ROUTES (Token Required) ---
// Only Admins can Add, Update, or Delete
router.post("/add", verifyAdmin, upload.array("images", 5), createTrip);
router.put("/update/:id", verifyAdmin, upload.array("images", 5), updateTrip);
router.delete("/delete/:id", verifyAdmin, deleteTrip);

module.exports = router;
