import express from "express";
import { handleScan } from "../controllers/scan.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Define the POST endpoint for scan submissions (protected)
router.post("/scan", authenticateToken, handleScan);

export default router;
