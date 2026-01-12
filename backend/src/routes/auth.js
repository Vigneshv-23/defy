import express from "express";
import User from "../models/User.js";
import crypto from "crypto";

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with email/password
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, username, role = "user" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      username: username || email.split("@")[0],
      roles: [role]
    });

    // Generate simple token (in production, use JWT)
    const token = crypto.randomBytes(32).toString("hex");

    res.json({
      user: {
        email: user.email,
        username: user.username,
        roles: user.roles,
        id: user._id
      },
      token
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

/**
 * POST /api/auth/login
 * Login with email/password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");

    res.json({
      user: {
        email: user.email,
        username: user.username,
        roles: user.roles,
        id: user._id
      },
      token
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

export default router;
