const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Login required" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

router.post("/", async (req, res) => {
  try {
    const { reviewId, reason } = req.body;

    if (!reviewId) {
      return res.status(400).json({ message: "Review is required" });
    }

    if (!reason?.trim()) {
      return res.status(400).json({ message: "Report reason is required" });
    }

    const result = await pool.query(
      `INSERT INTO review_reports (review_id, reason)
       VALUES ($1, $2)
       RETURNING id, review_id, reason, status, created_at`,
      [reviewId, reason.trim()]
    );

    res.status(201).json({
      message: "Review reported successfully",
      report: result.rows[0],
    });
  } catch (error) {
    console.error("Error reporting review:", error);
    res.status(500).json({ message: "Server error while reporting review" });
  }
});

router.get("/", async (req, res) => {
  try {
    // Admin protection can be added later when admin auth is fully connected here.
    const result = await pool.query(
      `SELECT review_reports.id,
              review_reports.review_id,
              review_reports.reason,
              review_reports.status,
              review_reports.created_at,
              reviews.rating AS review_rating,
              reviews.comment AS review_comment,
              reviews.user_id AS reviewer_id,
              restaurants.name AS restaurant_name,
              users.full_name AS reviewer_name
       FROM review_reports
       LEFT JOIN reviews ON review_reports.review_id = reviews.id
       LEFT JOIN restaurants ON reviews.restaurant_id = restaurants.id
       LEFT JOIN users ON reviews.user_id = users.id
       ORDER BY review_reports.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching reported reviews:", error);
    res.status(500).json({ message: "Server error while fetching reports" });
  }
});

router.delete("/:id/review", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const reportResult = await pool.query(
      `SELECT review_reports.review_id
       FROM review_reports
       WHERE review_reports.id = $1`,
      [id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    await pool.query("DELETE FROM reviews WHERE id = $1", [
      reportResult.rows[0].review_id,
    ]);

    res.json({ message: "Reported review deleted successfully" });
  } catch (error) {
    console.error("Error deleting reported review:", error);
    res.status(500).json({ message: "Server error while deleting reported review" });
  }
});

router.post("/:id/suspend", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, reason } = req.body;

    const reportResult = await pool.query(
      `SELECT reviews.user_id
       FROM review_reports
       JOIN reviews ON review_reports.review_id = reviews.id
       WHERE review_reports.id = $1`,
      [id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ message: "Report or review not found" });
    }

    const reviewerId = reportResult.rows[0].user_id;
    const suspensionReason = reason?.trim() || "Review report moderation";
    let suspendedUntil = null;
    let suspendedPermanent = false;

    if (duration === "7") {
      suspendedUntil = "7 days";
    } else if (duration === "30") {
      suspendedUntil = "30 days";
    } else if (duration === "forever") {
      suspendedPermanent = true;
    } else {
      return res.status(400).json({ message: "Choose a valid suspension duration" });
    }

    const result = await pool.query(
      `UPDATE users
       SET suspended_until = CASE WHEN $1::text IS NULL THEN NULL ELSE NOW() + $1::interval END,
           suspended_permanent = $2,
           suspension_reason = $3
       WHERE id = $4
       RETURNING id, full_name, suspended_until, suspended_permanent, suspension_reason`,
      [suspendedUntil, suspendedPermanent, suspensionReason, reviewerId]
    );

    await pool.query(
      "UPDATE review_reports SET status = $1 WHERE id = $2",
      ["user_suspended", id]
    );

    res.json({
      message: "Reviewer suspended successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error suspending reviewer:", error);
    res.status(500).json({ message: "Server error while suspending reviewer" });
  }
});

module.exports = router;
