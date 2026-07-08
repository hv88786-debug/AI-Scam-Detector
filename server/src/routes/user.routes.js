import express from "express";
import { queryAll, queryGet, queryRun } from "../services/db.service.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET all scans for the authenticated user, with optional search and risk filtering
router.get("/scans", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, risk } = req.query;

    let sql = "SELECT * FROM Scans WHERE user_id = ?";
    const params = [userId];

    if (risk) {
      sql += " AND LOWER(risk) = ?";
      params.push(String(risk).toLowerCase());
    }

    if (search) {
      sql += " AND (content LIKE ? OR category LIKE ? OR summary LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Newest scans first
    sql += " ORDER BY timestamp DESC";

    const scans = await queryAll(sql, params);

    // Parse reasons back to arrays
    const formattedScans = scans.map(scan => ({
      ...scan,
      reasons: JSON.parse(scan.reasons || "[]"),
    }));

    return res.status(200).json({
      success: true,
      data: formattedScans,
    });

  } catch (error) {
    next(error);
  }
});

// GET a specific scan by id for the authenticated user
router.get("/scans/:id", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const scan = await queryGet("SELECT * FROM Scans WHERE id = ? AND user_id = ?", [id, userId]);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan report not found or you are not authorized to view it.",
      });
    }

    const formattedScan = {
      ...scan,
      reasons: JSON.parse(scan.reasons || "[]"),
    };

    return res.status(200).json({
      success: true,
      data: formattedScan,
    });

  } catch (error) {
    next(error);
  }
});

// DELETE a specific scan by id for the authenticated user
router.delete("/scans/:id", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if scan exists and belongs to the user
    const scan = await queryGet("SELECT id FROM Scans WHERE id = ? AND user_id = ?", [id, userId]);
    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan report not found or you are not authorized to delete it.",
      });
    }

    await queryRun("DELETE FROM Scans WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Scan report deleted successfully.",
    });

  } catch (error) {
    next(error);
  }
});

export default router;
