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

router.get("/", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, phone_number, role, created_at,
              suspended_until, suspended_permanent, suspension_reason
       FROM users
       ORDER BY id ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

router.post("/:id/unsuspend", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users
       SET suspended_until = NULL,
           suspended_permanent = false,
           suspension_reason = NULL
       WHERE id = $1
       RETURNING id, full_name, phone_number, role, created_at,
                 suspended_until, suspended_permanent, suspension_reason`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User unsuspended successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error unsuspending user:", error);
    res.status(500).json({ message: "Server error while unsuspending user" });
  }
});

module.exports = router;
