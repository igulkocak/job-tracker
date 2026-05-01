const { Router } = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function userPayload(user) {
  return { id: user._id, name: user.name, email: user.email };
}

// ── POST /register ────────────────────────────────────────────────────────────
/**
 * Body: { name, email, password }
 * Returns: { success, token, user }
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Manual validation keeps the dependency count low
    if (!name?.trim())      return res.status(400).json({ success: false, message: "Name is required" });
    if (!email?.trim())     return res.status(400).json({ success: false, message: "Email is required" });
    if (!password)          return res.status(400).json({ success: false, message: "Password is required" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    const user = await User.create({ name: name.trim(), email, password });
    const token = signToken(user._id);

    res.status(201).json({ success: true, token, user: userPayload(user) });
  } catch (err) {
    // Mongoose duplicate key (race condition fallback)
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ── POST /login ───────────────────────────────────────────────────────────────
/**
 * Body: { email, password }
 * Returns: { success, token, user }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Re-select password — it's excluded by default via { select: false }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = signToken(user._id);
    res.json({ success: true, token, user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;
