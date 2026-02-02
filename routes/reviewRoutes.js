const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware"); // Ensure user is logged in

router.post("/add", authMiddleware, reviewController.createReview);

module.exports = router;
