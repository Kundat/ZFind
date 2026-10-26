
const express = require("express");
const pool = require("../db");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

const VALID_CATEGORIES = [
  "JOB",
  "TRAINING",
  "INTERNSHIP",
  "SCHOLARSHIP",
  "VOLUNTEERING",
  "GRANT",
  "ENTREPRENEURSHIP",
  "FELLOWSHIP",
  "COMPETITION",
];

const VALID_STATUSES = ["UNVERIFIED", "VERIFIED", "REJECTED"];

// GET /api/opportunities
// Public: search and browse opportunities.
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    const conditions = [];
    const params = [];

    const selectedCategory = String(category || "").toUpperCase();

    if (VALID_CATEGORIES.includes(selectedCategory)) {
      conditions.push("category = ?");
      params.push(selectedCategory);
    }

    if (search && String(search).trim()) {
      conditions.push(
        "(title LIKE ? OR organisation LIKE ? OR description LIKE ?)"
      );

      const term = `%${String(search).trim().slice(0, 100)}%`;
      params.push(term, term, term);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [rows] = await pool.query(
      `SELECT id, title, organisation, description, category,
              application_url, deadline, source_url,
              verification_status, created_at
       FROM opportunities
       ${where}
       ORDER BY created_at DESC
       LIMIT 100`,
      params
    );

    res.json({ data: rows });
  } catch (error) {
    console.error("Could not load opportunities:", error.message);

    res.status(500).json({
      error: "Could not load opportunities.",
    });
  }
});

// PATCH /api/opportunities/:id/verification
// Admin only: verify or reject an opportunity.
router.patch("/:id/verification", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").toUpperCase();

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Invalid opportunity ID.",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: "Status must be UNVERIFIED, VERIFIED, or REJECTED.",
      });
    }

    const [result] = await pool.query(
      `UPDATE opportunities
       SET verification_status = ?
       WHERE id = ?`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      const [rows] = await pool.query(
        "SELECT id FROM opportunities WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          error: "Opportunity not found.",
        });
      }
    }

    res.json({
      message: `Opportunity status updated to ${status}.`,
      id,
      verification_status: status,
    });
  } catch (error) {
    console.error("Could not update verification status:", error.message);

    res.status(500).json({
      error: "Could not update opportunity verification status.",
    });
  }
});

module.exports = router;
