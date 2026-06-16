const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const pool = require("../config/db");

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

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM restaurants ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ message: "Server error while fetching restaurants" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, location, description } = req.body;
    const imageUrl = req.body.imageUrl || req.body.image_url || "";

    if (!name?.trim() || !location?.trim()) {
      return res.status(400).json({ message: "Name and location are required" });
    }

    const result = await pool.query(
      `INSERT INTO restaurants (name, location, description, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, location, description, image_url, created_at`,
      [name.trim(), location.trim(), description || "", imageUrl.trim()]
    );

    res.status(201).json({
      message: "Restaurant added successfully",
      restaurant: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding restaurant:", error);
    res.status(500).json({ message: "Server error while adding restaurant" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const restaurantId = req.params.id;

    const result = await pool.query(
      "SELECT * FROM restaurants WHERE id = $1",
      [restaurantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ message: "Server error while fetching restaurant" });
  }
});

module.exports = router;
