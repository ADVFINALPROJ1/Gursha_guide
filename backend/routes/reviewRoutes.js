const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

function requireLogin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Please login to continue" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired login. Please login again" });
  }
}

function getOptionalUser(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const user = getOptionalUser(req);
    const userId = user?.id || null;

    const result = await pool.query(
      `SELECT reviews.id, reviews.user_id, reviews.rating, reviews.comment,
              reviews.created_at, reviews.is_verified,
              reviews.upvotes, reviews.downvotes,
              review_votes.vote_type AS user_vote,
              users.full_name AS reviewer_name
       FROM reviews
       LEFT JOIN users ON reviews.user_id = users.id
       LEFT JOIN review_votes
         ON review_votes.review_id = reviews.id
        AND review_votes.user_id = $2
       WHERE reviews.restaurant_id = $1
       ORDER BY reviews.created_at DESC`,
      [restaurantId, userId]
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

    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admins cannot submit reviews" });
    }

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
       RETURNING id, user_id, restaurant_id, rating, comment, created_at,
                 is_verified, upvotes, downvotes`,
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

router.patch("/:id/upvote", requireLogin, async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    await client.query("BEGIN");

    const existingReview = await client.query(
      "SELECT id FROM reviews WHERE id = $1",
      [id]
    );

    if (existingReview.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Review not found" });
    }

    await client.query(
      `INSERT INTO review_votes (review_id, user_id, vote_type)
       VALUES ($1, $2, 'upvote')`,
      [id, userId]
    );

    const result = await client.query(
      `UPDATE reviews
       SET upvotes = COALESCE(upvotes, 0) + 1
       WHERE id = $1
       RETURNING upvotes, downvotes`,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Review upvoted successfully",
      upvotes: result.rows[0].upvotes,
      downvotes: result.rows[0].downvotes,
      user_vote: "upvote",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(400).json({ message: "You already voted on this review" });
    }

    console.error("Error upvoting review:", error);
    res.status(500).json({ message: "Server error while upvoting review" });
  } finally {
    client.release();
  }
});

router.patch("/:id/downvote", requireLogin, async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    await client.query("BEGIN");

    const existingReview = await client.query(
      "SELECT id FROM reviews WHERE id = $1",
      [id]
    );

    if (existingReview.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Review not found" });
    }

    await client.query(
      `INSERT INTO review_votes (review_id, user_id, vote_type)
       VALUES ($1, $2, 'downvote')`,
      [id, userId]
    );

    const result = await client.query(
      `UPDATE reviews
       SET downvotes = COALESCE(downvotes, 0) + 1
       WHERE id = $1
       RETURNING upvotes, downvotes`,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Review downvoted successfully",
      upvotes: result.rows[0].upvotes,
      downvotes: result.rows[0].downvotes,
      user_vote: "downvote",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(400).json({ message: "You already voted on this review" });
    }

    console.error("Error downvoting review:", error);
    res.status(500).json({ message: "Server error while downvoting review" });
  } finally {
    client.release();
  }
});

router.put("/:id", requireLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admins cannot edit reviews" });
    }

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" });
    }

    const ratingNumber = Number(rating);

    if (!Number.isFinite(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const savedRating = Math.round(ratingNumber * 10) / 10;

    const result = await pool.query(
      `UPDATE reviews
       SET rating = $1, comment = $2
       WHERE id = $3
         AND user_id = $4
       RETURNING id, user_id, restaurant_id, rating, comment, created_at,
                 is_verified, upvotes, downvotes`,
      [savedRating, trimmedComment, id, userId]
    );

    if (result.rows.length === 0) {
      const existingReview = await pool.query(
        "SELECT id FROM reviews WHERE id = $1",
        [id]
      );

      if (existingReview.rows.length === 0) {
        return res.status(404).json({ message: "Review not found" });
      }

      return res.status(403).json({ message: "You can only edit your own review" });
    }

    res.json({
      message: "Review updated successfully",
      review: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Server error while updating review" });
  }
});

router.delete("/:id", requireLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const result = await pool.query(
      `DELETE FROM reviews
       WHERE id = $1
         AND ($2 = true OR user_id = $3)
       RETURNING id`,
      [id, isAdmin, userId]
    );

    if (result.rows.length === 0) {
      const existingReview = await pool.query(
        "SELECT id FROM reviews WHERE id = $1",
        [id]
      );

      if (existingReview.rows.length === 0) {
        return res.status(404).json({ message: "Review not found" });
      }

      return res.status(403).json({ message: "You can only delete your own review" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error while deleting review" });
  }
});

module.exports = router;
