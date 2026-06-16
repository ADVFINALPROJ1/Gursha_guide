const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { restaurantId, rating, comment } = req.body;
    // Temporary user id until reviews are connected to the logged-in user.
    const userId = req.body.userId || 1;

    if (!restaurantId || !rating || !comment) {
      return res.status(400).json({
        message: "Restaurant, rating, and comment are required",
      });
    }

    const ratingNumber = Number(rating);

    if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, restaurant_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, restaurant_id, rating, comment, created_at`,
      [userId, restaurantId, ratingNumber, trimmedComment]
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
