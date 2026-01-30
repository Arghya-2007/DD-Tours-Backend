const jwt = require("jsonwebtoken");

const verifyAdmin = (req, res, next) => {
  // 1. Get the token from the header (Authorization: Bearer <token>)
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2. Verify the token using your Secret Key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if the decoded payload has the admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Not an Admin" });
    }

    // 4. Attach user info to request and proceed
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or Expired Token" });
  }
};

module.exports = verifyAdmin;
