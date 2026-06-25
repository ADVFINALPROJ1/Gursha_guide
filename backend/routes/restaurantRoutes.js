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

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const latDistance = ((lat2 - lat1) * Math.PI) / 180;
  const lngDistance = ((lng2 - lng1) * Math.PI) / 180;
  const startLat = (lat1 * Math.PI) / 180;
  const endLat = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function getCoordinate(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function hasInvalidCoordinate(value) {
  return value !== undefined && value !== null && value !== "" && !Number.isFinite(Number(value));
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT restaurants.id, restaurants.name, restaurants.location,
              restaurants.description, restaurants.image_url,
              restaurants.latitude, restaurants.longitude,
              restaurants.created_at,
              ROUND(AVG(reviews.rating)::numeric, 1) AS average_rating,
              COUNT(reviews.id)::int AS review_count
       FROM restaurants
       LEFT JOIN reviews ON restaurants.id = reviews.restaurant_id
       GROUP BY restaurants.id
       ORDER BY restaurants.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ message: "Server error while fetching restaurants" });
  }
});

router.get("/nearby", async (req, res) => {
  try {
    const userLat = Number(req.query.lat);
    const userLng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm || 20);

    if (!req.query.lat || !req.query.lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
      return res.status(400).json({ message: "Latitude and longitude must be numbers" });
    }

    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      return res.status(400).json({ message: "Radius must be a positive number" });
    }

    const result = await pool.query(
      `SELECT restaurants.id, restaurants.name, restaurants.location,
              restaurants.description, restaurants.image_url,
              restaurants.latitude, restaurants.longitude,
              ROUND(AVG(reviews.rating)::numeric, 1) AS average_rating,
              COUNT(reviews.id)::int AS review_count
       FROM restaurants
       LEFT JOIN reviews ON restaurants.id = reviews.restaurant_id
       WHERE restaurants.latitude IS NOT NULL
         AND restaurants.longitude IS NOT NULL
       GROUP BY restaurants.id
       ORDER BY restaurants.id DESC`
    );

    const restaurants = result.rows
      .map((restaurant) => {
        const averageRating =
          restaurant.average_rating === null
            ? null
            : Number(restaurant.average_rating);
        const distanceKm = calculateDistanceKm(
          userLat,
          userLng,
          Number(restaurant.latitude),
          Number(restaurant.longitude)
        );

        return {
          ...restaurant,
          average_rating: averageRating,
          review_count: Number(restaurant.review_count || 0),
          distance_km: Number(distanceKm.toFixed(2)),
        };
      })
      .filter((restaurant) => restaurant.distance_km <= radiusKm)
      .sort((a, b) => {
        const ratingA = a.average_rating || 0;
        const ratingB = b.average_rating || 0;

        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }

        return a.distance_km - b.distance_km;
      });

    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching nearby restaurants:", error);
    res.status(500).json({ message: "Server error while fetching nearby restaurants" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, location, description } = req.body;
    const imageUrl = req.body.imageUrl || req.body.image_url || "";
    const latitude = getCoordinate(req.body.latitude);
    const longitude = getCoordinate(req.body.longitude);

    if (!name?.trim() || !location?.trim()) {
      return res.status(400).json({ message: "Name and location are required" });
    }

    if (hasInvalidCoordinate(req.body.latitude) || hasInvalidCoordinate(req.body.longitude)) {
      return res.status(400).json({ message: "Latitude and longitude must be numbers" });
    }

    const result = await pool.query(
      `INSERT INTO restaurants (name, location, description, image_url, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, location, description, image_url, latitude, longitude, created_at`,
      [name.trim(), location.trim(), description || "", imageUrl.trim(), latitude, longitude]
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

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const { name, location, description } = req.body;
    const imageUrl = req.body.imageUrl || req.body.image_url || "";
    const latitude = getCoordinate(req.body.latitude);
    const longitude = getCoordinate(req.body.longitude);

    if (!name?.trim() || !location?.trim()) {
      return res.status(400).json({ message: "Name and location are required" });
    }

    if (hasInvalidCoordinate(req.body.latitude) || hasInvalidCoordinate(req.body.longitude)) {
      return res.status(400).json({ message: "Latitude and longitude must be numbers" });
    }

    const result = await pool.query(
      `UPDATE restaurants
       SET name = $1, location = $2, description = $3, image_url = $4,
           latitude = $5, longitude = $6
       WHERE id = $7
       RETURNING id, name, location, description, image_url, latitude, longitude, created_at`,
      [
        name.trim(),
        location.trim(),
        description || "",
        imageUrl.trim(),
        latitude,
        longitude,
        restaurantId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json({
      message: "Restaurant updated successfully",
      restaurant: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ message: "Server error while updating restaurant" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    const restaurantId = req.params.id;

    await client.query("BEGIN");

    const existingRestaurant = await client.query(
      "SELECT id FROM restaurants WHERE id = $1",
      [restaurantId]
    );

    if (existingRestaurant.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Restaurant not found" });
    }

    await client.query("DELETE FROM reviews WHERE restaurant_id = $1", [
      restaurantId,
    ]);
    await client.query("DELETE FROM restaurants WHERE id = $1", [restaurantId]);
    await client.query("COMMIT");

    res.json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting restaurant:", error);
    res.status(500).json({ message: "Server error while deleting restaurant" });
  } finally {
    client.release();
  }
});

router.get("/:id", async (req, res) => {
  try {
    const restaurantId = req.params.id;

    const result = await pool.query(
      `SELECT restaurants.id, restaurants.name, restaurants.location,
              restaurants.description, restaurants.image_url,
              restaurants.latitude, restaurants.longitude,
              restaurants.created_at,
              ROUND(AVG(reviews.rating)::numeric, 1) AS average_rating,
              COUNT(reviews.id)::int AS review_count
       FROM restaurants
       LEFT JOIN reviews ON restaurants.id = reviews.restaurant_id
       WHERE restaurants.id = $1
       GROUP BY restaurants.id`,
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
