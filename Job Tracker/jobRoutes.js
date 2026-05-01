const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");
const Job = require("../models/Job");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

const VALID_STATUSES = ["Applied", "Interview", "Offer", "Rejected"];
const VALID_SORT_FIELDS = ["createdAt", "updatedAt", "company", "position", "appliedAt", "status"];

// ─── GET /api/jobs ─────────────────────────────────────────────────────────────
// Query params: status, search, sortBy, order, page, limit
router.get(
  "/",
  [
    query("status").optional().isIn(VALID_STATUSES),
    query("sortBy").optional().isIn(VALID_SORT_FIELDS),
    query("order").optional().isIn(["asc", "desc"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { status, search, sortBy = "createdAt", order = "desc", page = 1, limit = 20 } = req.query;

      const filter = { user: req.user._id };
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { company: { $regex: search, $options: "i" } },
          { position: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ];
      }

      const sortOrder = order === "asc" ? 1 : -1;
      const skip = (Number(page) - 1) * Number(limit);

      const [jobs, total] = await Promise.all([
        Job.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(Number(limit)).lean(),
        Job.countDocuments(filter),
      ]);

      // Stats summary
      const stats = await Job.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      const statsMap = VALID_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
      stats.forEach(({ _id, count }) => { statsMap[_id] = count; });

      res.json({
        success: true,
        data: jobs,
        pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
        stats: statsMap,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  }
);

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, data: job });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(404).json({ success: false, message: "Job not found" });
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ─── POST /api/jobs ───────────────────────────────────────────────────────────
router.post(
  "/",
  [
    body("company").trim().notEmpty().withMessage("Company is required").isLength({ max: 100 }),
    body("position").trim().notEmpty().withMessage("Position is required").isLength({ max: 100 }),
    body("status").optional().isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
    body("url").optional({ checkFalsy: true }).isURL().withMessage("Please enter a valid URL"),
    body("salary.min").optional().isNumeric().withMessage("Salary min must be a number"),
    body("salary.max").optional().isNumeric().withMessage("Salary max must be a number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const job = await Job.create({ ...req.body, user: req.user._id });
      res.status(201).json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  }
);

// ─── PUT /api/jobs/:id ────────────────────────────────────────────────────────
router.put(
  "/:id",
  [
    body("company").optional().trim().notEmpty().isLength({ max: 100 }),
    body("position").optional().trim().notEmpty().isLength({ max: 100 }),
    body("status").optional().isIn(VALID_STATUSES),
    body("url").optional({ checkFalsy: true }).isURL(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const job = await Job.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!job) return res.status(404).json({ success: false, message: "Job not found" });
      res.json({ success: true, data: job });
    } catch (error) {
      if (error.kind === "ObjectId") return res.status(404).json({ success: false, message: "Job not found" });
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  }
);

// ─── DELETE /api/jobs/:id ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(404).json({ success: false, message: "Job not found" });
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ─── PATCH /api/jobs/:id/status ───────────────────────────────────────────────
router.patch(
  "/:id/status",
  [body("status").isIn(VALID_STATUSES).withMessage("Invalid status")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const job = await Job.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { $set: { status: req.body.status } },
        { new: true }
      );
      if (!job) return res.status(404).json({ success: false, message: "Job not found" });
      res.json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  }
);

module.exports = router;
