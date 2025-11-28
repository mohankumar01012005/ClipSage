// src/utils/jwt.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const SECRET = process.env.JWT_SECRET;
const EXP = process.env.JWT_EXPIRES_IN;

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXP });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
