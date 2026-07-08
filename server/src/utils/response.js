/**
 * Helper to return success JSON responses
 * @param {import('express').Response} res 
 * @param {any} data 
 * @param {number} status 
 */
export const successResponse = (res, data, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  });
};

/**
 * Helper to return error JSON responses
 * @param {import('express').Response} res 
 * @param {string} message 
 * @param {number} status 
 */
export const errorResponse = (res, message, status = 500) => {
  return res.status(status).json({
    success: false,
    message,
  });
};
