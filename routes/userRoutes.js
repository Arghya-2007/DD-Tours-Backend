// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { getAllUsers, deleteUser } = require("../controllers/userController");
const verifyAdmin = require("../middleware/authMiddleware");

// Protect these routes! Only Admins can see/delete users.
router.get("/all", verifyAdmin, getAllUsers);
router.delete("/delete/:id", verifyAdmin, deleteUser);

module.exports = router;
