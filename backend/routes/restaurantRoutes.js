const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM restaurants ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ message: "Server error while fetching restaurants" });
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