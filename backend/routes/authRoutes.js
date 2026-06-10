const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { fullName, phoneNumber, password } = req.body;

    if (!fullName || !phoneNumber || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE phone_number = $1",
      [phoneNumber]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, phone_number, password)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, phone_number, role`,
      [fullName, phoneNumber, hashedPassword]
    );

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;