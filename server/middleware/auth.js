// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret';

export async function verifyTokenParam(req, res, next) {
  try {
    const { userId, token } = req.params;
    if (!userId || !token) return res.status(400).json({ error: 'userId and token required in params' });

    // 1) Try JWT verification (common)
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.userId === userId) {
        req.auth = { method: 'jwt', userId: decoded.userId };
        return next();
      }
    } catch (e) {
      // JWT didn't verify — fallthrough to check stored token
    }

    // 2) Fallback: check stored token in user document (simple token scheme)
    const user = await User.findById(userId).select('+token');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.token && user.token === token) {
      req.auth = { method: 'stored', userId: user.id };
      return next();
    }

    return res.status(401).json({ error: 'Invalid token' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
