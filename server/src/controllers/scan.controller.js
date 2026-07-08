import { scanContent } from "../services/gemini.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { queryRun } from "../services/db.service.js";

/**
 * Controller handler for content scans
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export const handleScan = async (req, res, next) => {
  try {
    const { type, content } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return errorResponse(res, "User must be authenticated to perform scan operations.", 401);
    }

    // 1. Validation
    if (!type || !content) {
      return errorResponse(res, "Both 'type' and 'content' fields are required in the request body.", 400);
    }

    const validTypes = ["url", "text", "email"];
    if (!validTypes.includes(type.toLowerCase())) {
      return errorResponse(res, `Invalid scan type. Allowed values: ${validTypes.join(", ")}`, 400);
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return errorResponse(res, "Scan 'content' must be a non-empty string.", 400);
    }

    // 2. Call Gemini Service
    const rawJson = await scanContent(type.toLowerCase(), content.trim());

    // 3. Safe JSON parsing
    let parsedData;
    try {
      parsedData = JSON.parse(rawJson);
    } catch (parseErr) {
      console.error("Failed to parse Gemini scan JSON output:", parseErr, "\nRaw payload:", rawJson);
      return errorResponse(res, "AI model output could not be formatted into structured JSON data.", 500);
    }

    // Ensure all required fields exist on parsedData before saving
    const risk = parsedData.risk || "Suspicious";
    const confidence = typeof parsedData.confidence === "number" ? parsedData.confidence : 50;
    const category = parsedData.category || "General Threat";
    const summary = parsedData.summary || "No summary provided by the threat intelligence unit.";
    const reasons = Array.isArray(parsedData.reasons) ? parsedData.reasons : [];
    const recommendation = parsedData.recommendation || "Proceed with caution.";

    // 4. Save to database for authenticated user (Every successful scan is saved)
    try {
      const insertResult = await queryRun(
        `INSERT INTO Scans (user_id, type, content, risk, confidence, category, summary, reasons, recommendation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          type.toLowerCase(),
          content.trim(),
          risk,
          confidence,
          category,
          summary,
          JSON.stringify(reasons),
          recommendation
        ]
      );
      
      // Inject the saved ID to return to the client
      parsedData.id = insertResult.id;
    } catch (dbErr) {
      console.error("Failed to save scan history to SQLite database:", dbErr);
      // We still return parsedData to user even if DB log fails so we do not block user UX,
      // but log it to server console.
    }

    // 5. Return success response
    return successResponse(res, parsedData);
  } catch (error) {
    // Never crash the server, pass to error-handling middleware
    next(error);
  }
};
