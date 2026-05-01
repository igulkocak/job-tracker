const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protects routes: verifies the Bearer token and attaches req.user.
 * On failure responds immediately with 401 so route handlers stay clean.
 */
module.exports = async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    req.user = user; // available in all downstream handlers
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
