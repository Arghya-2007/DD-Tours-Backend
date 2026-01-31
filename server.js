const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const adminRoutes = require("./routes/adminRoutes");
const tripRoutes = require("./routes/tripRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();

// --- SECURITY MIDDLEWARE ---

// 1. Helmet: Sets security headers
app.use(helmet());

// 2. General Rate Limiter
// Limits all requests to 100 per 15 minutes to prevent crashing
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply General Limiter to all API routes
app.use("/api", generalLimiter);

// --- MIDDLEWARE ---
// Allow requests from your frontend (Update URLs when you deploy)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://localhost:5174",
      "https://dd-tours-admin.vercel.app",
      "http://localhost:5175",
    ],
    credentials: true,
  }),
);

app.use(express.json());

// --- ROUTES ---
app.use("/api/admin", adminRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/users", userRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("DD Tour & Travel API is Running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
