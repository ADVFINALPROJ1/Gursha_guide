const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

function requireLogin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Please login to submit a review" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired login. Please login again" });
  }
}

router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const result = await pool.query(
      `SELECT reviews.id, reviews.user_id, reviews.rating, reviews.comment, reviews.created_at,
              users.full_name AS reviewer_name
       FROM reviews
       LEFT JOIN users ON reviews.user_id = users.id
       WHERE reviews.restaurant_id = $1
       ORDER BY reviews.created_at DESC`,
      [restaurantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching restaurant reviews:", error);
    res.status(500).json({ message: "Server error while fetching reviews" });
  }
});

router.post("/", requireLogin, async (req, res) => {
  try {
    const { restaurantId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!restaurantId || !rating || !comment) {
      return res.status(400).json({
        message: "Restaurant, rating, and comment are required",
      });
    }

    const ratingNumber = Number(rating);

    if (!Number.isFinite(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const savedRating = Math.round(ratingNumber * 10) / 10;

    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, restaurant_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, restaurant_id, rating, comment, created_at`,
      [userId, restaurantId, savedRating, trimmedComment]
    );

    res.status(201).json({
      message: "Review submitted successfully",
      review: result.rows[0],
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server error while submitting review" });
  }
});

module.exports = router;
