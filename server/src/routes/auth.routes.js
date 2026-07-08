import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { queryGet, queryRun } from "../services/db.service.js";
import { config } from "../config/env.js";

const router = express.Router();
const JWT_SECRET = config.jwtSecret;

// Register Route
router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Both email and password are required.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Check if user already exists
    const existingUser = await queryGet("SELECT id FROM Users WHERE email = ?", [trimmedEmail]);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await queryRun(
      "INSERT INTO Users (email, password) VALUES (?, ?)",
      [trimmedEmail, hashedPassword]
    );

    // Create JWT token
    const token = jwt.sign(
      { id: result.id, email: trimmedEmail },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      token,
      user: {
        id: result.id,
        email: trimmedEmail,
      },
    });

  } catch (error) {
    next(error);
  }
});

// Login Route
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Both email and password are required.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Retrieve user from DB
    const user = await queryGet("SELECT * FROM Users WHERE email = ?", [trimmedEmail]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Successfully logged in.",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });

  } catch (error) {
    next(error);
  }
});

export default router;
