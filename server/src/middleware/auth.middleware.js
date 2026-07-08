import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

const JWT_SECRET = config.jwtSecret;

/**
 * Middleware to protect API routes with JWT Authentication
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing. Please login to access this resource.",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired authentication token. Please login again.",
      });
    }

    req.user = user; // Attach user info (id, email) to request object
    next();
  });
};
