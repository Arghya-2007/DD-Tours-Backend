const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// --- IMPORTS ---
const adminRoutes = require("./routes/adminRoutes");
const tripRoutes = require("./routes/tripRoutes");
const userRoutes = require("./routes/userRoutes");
const bookingRoutes = require("./routes/bookingRoutes"); // <--- ADD THIS BACK

dotenv.config();

const app = express();
app.set("trust proxy", 1);

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

// --- CORS CONFIGURATION ---
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Admin Local
      "http://localhost:5174", // Customer Local
      "http://localhost:5175", // (Just in case)
      "https://dd-tours-admin.vercel.app", // Admin Live
      // Add your Customer Vercel URL here later!
    ],
    credentials: true,
  }),
);

app.use(express.json());

// --- ROUTES ---
app.use("/api/admin", adminRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes); // <--- ADD THIS BACK

// Root Route
app.get("/", (req, res) => {
  res.send("DD Tour & Travel API is Running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
