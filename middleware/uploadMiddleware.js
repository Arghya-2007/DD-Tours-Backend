// src/middleware/uploadMiddleware.js
const multer = require("multer");

// Configure storage: We use memoryStorage so we can access
// file.buffer in the controller (needed for Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Optional: Limit file size to 5MB
  },
});

module.exports = upload;
