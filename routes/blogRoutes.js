const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const { verifyAdmin } = require("../middleware/authMiddleware"); // Uncomment if you want protection

router.post("/add", verifyAdmin, blogController.createBlog);
router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);
router.delete("/:id", verifyAdmin, blogController.deleteBlog);

module.exports = router;
