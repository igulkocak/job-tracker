const { Router } = require("express");
const Job = require("../models/Job");
const protect = require("../middleware/protect");

const router = Router();

// Every route in this file requires a valid JWT
router.use(protect);

// ── GET /jobs ─────────────────────────────────────────────────────────────────
/**
 * Returns all jobs for the authenticated user.
 * Optional query params:
 *   status   – filter by status   e.g. ?status=Interview
 *   search   – search company/position (case-insensitive)
 *   sortBy   – field to sort by   (default: createdAt)
 *   order    – asc | desc         (default: desc)
 *   page     – page number        (default: 1)
 *   limit    – results per page   (default: 20, max 100)
 */
router.get("/", async (req, res) => {
  try {
    const {
      status,
      search,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter — always scope to the authenticated user
    const filter = { user: req.user._id };
    if (status)  filter.status = status;
    if (search) {
      const rx = { $regex: search, $options: "i" };
      filter.$or = [{ company: rx }, { position: rx }];
    }

    const allowedSortFields = ["createdAt", "updatedAt", "company", "position", "status", "appliedAt"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const safeOrder  = order === "asc" ? 1 : -1;
    const safeLimit  = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip       = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ [safeSortBy]: safeOrder })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Job.countDocuments(filter),
    ]);

    // Status breakdown for dashboard stats
    const statsAgg = await Job.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const stats = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
    statsAgg.forEach(({ _id, count }) => { if (_id in stats) stats[_id] = count; });

    res.json({
      success: true,
      count: jobs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / safeLimit),
      stats,
      data: jobs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ── POST /jobs ────────────────────────────────────────────────────────────────
/**
 * Body: { company*, position*, status, location, salary, url, notes, appliedAt }
 * Returns: { success, data: newJob }
 */
router.post("/", async (req, res) => {
  try {
    const { company, position } = req.body;

    if (!company?.trim()) return res.status(400).json({ success: false, message: "Company is required" });
    if (!position?.trim()) return res.status(400).json({ success: false, message: "Position is required" });

    const job = await Job.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((e) => e.message).join("; ");
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ── PUT /jobs/:id ─────────────────────────────────────────────────────────────
/**
 * Partial update — only the fields sent in the body are changed.
 * User can only update their own jobs (enforced via filter).
 */
router.put("/:id", async (req, res) => {
  try {
    // Prevent user field from being overwritten
    delete req.body.user;

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, // ownership check
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, data: job });
  } catch (err) {
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((e) => e.message).join("; ");
      return res.status(400).json({ success: false, message });
    }
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ── DELETE /jobs/:id ──────────────────────────────────────────────────────────
/**
 * Permanently deletes a job.
 * User can only delete their own jobs (enforced via filter).
 */
router.delete("/:id", async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: "Job deleted" });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;
