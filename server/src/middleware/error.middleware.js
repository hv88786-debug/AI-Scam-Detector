import { errorResponse } from "../utils/response.js";

/**
 * Express error-handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log the detailed error for server analytics/debugging
  console.error(`[ERRORLOG] [${new Date().toISOString()}] - ${err.stack || err.message}`);

  const status = err.status || 500;
  // Never expose raw internal server errors/db errors to client
  const message = status >= 500
    ? "An internal server error occurred while processing the request."
    : (err.message || "An error occurred.");

  return errorResponse(res, message, status);
};
