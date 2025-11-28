// src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import User from "../models/user.js";
import { signToken } from "../utils/jwt.js";

const router = express.Router();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email or username already exists
    const exists = await User.findOne({
      $or: [{ email: normalizedEmail }]
    });
    if (exists) {
      return res.status(409).json({ message: "username or email already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await User.create({
      username,
      email: normalizedEmail,
      passwordHash
    });

    const tokenPayload = {
      id: user._id,
      username: user.username,
      email: user.email
    };

    const token = signToken(tokenPayload);

    return res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error("REGISTER ERR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const tokenPayload = {
      id: user._id,
      username: user.username,
      email: user.email
    };

    const token = signToken(tokenPayload);

    return res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error("LOGIN ERR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
