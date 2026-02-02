const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// --- IMPORTS ---
const adminRoutes = require("./routes/adminRoutes");
const tripRoutes = require("./routes/tripRoutes");
const userRoutes = require("./routes/userRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const blogRoutes = require("./routes/blogRoutes");

dotenv.config();

const app = express();
app.set("trust proxy", 1); // Crucial for Render

// --- SECURITY MIDDLEWARE ---
app.use(helmet());

// General Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", generalLimiter);

// --- CORS CONFIGURATION (Perfect!) ---
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://ddtours.in", // User Site
      "https://www.ddtours.in", // User Site (www)
      "https://admin.ddtours.in", // Admin Site
    ],
    credentials: true,
  }),
);

app.use(express.json());

// --- ROUTES (Updated to match Frontend) ---
// We add "/v1" here so it matches the request: /api/v1/trips
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/trips", tripRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/blogs", blogRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("DD Tour & Travel API is Running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
