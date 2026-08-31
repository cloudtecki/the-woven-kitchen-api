'use strict';

/**
 * Base application error.
 * All operational errors extend this class so the global error
 * handler can respond with a consistent JSON shape.
 */
class AppError extends Error {
  constructor(message, { statusCode = 500, isOperational = true, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
