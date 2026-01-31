// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { verifyUser, verifyAdmin } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  deleteUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");

// --- CUSTOMER ROUTES ---
router.get("/profile", verifyUser, getUserProfile);
router.put("/profile", verifyUser, updateUserProfile);

// --- ADMIN ROUTES ---
router.get("/", verifyAdmin, getAllUsers); // http://.../api/users?limit=10
router.delete("/:id", verifyAdmin, deleteUser);

module.exports = router;
