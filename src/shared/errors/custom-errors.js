'use strict';

const { AppError } = require('./app-error');
const { ERROR_CODES } = require('../constants/error-codes');

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { statusCode: 404, code: ERROR_CODES.NOT_FOUND });
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR, details });
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, { statusCode: 409, code: ERROR_CODES.CONFLICT });
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { statusCode: 401, code: ERROR_CODES.UNAUTHORIZED });
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, { statusCode: 403, code: ERROR_CODES.FORBIDDEN });
  }
}

class NotImplementedError extends AppError {
  constructor(message = 'Not implemented') {
    super(message, { statusCode: 501, code: ERROR_CODES.NOT_IMPLEMENTED });
  }
}

class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, { statusCode: 500, isOperational: false, code: ERROR_CODES.INTERNAL_ERROR });
  }
}

module.exports = {
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotImplementedError,
  InternalError,
};
