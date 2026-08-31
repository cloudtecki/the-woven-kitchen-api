'use strict';

/**
 * Wraps an async route/controller handler so rejected promises are
 * forwarded to the Express error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
