require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const connectDB = require("./config/db");

const app = express();

// ── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "16kb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/register", require("./routes/auth"));   // POST /register  POST /login
app.use("/login",    require("./routes/auth"));   // same router, different mount
app.use("/jobs",     require("./routes/jobs"));   // GET  /jobs  POST /jobs  PUT /jobs/:id  DELETE /jobs/:id

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` })
);

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀  Server listening on http://localhost:${PORT}`)
);
