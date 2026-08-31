'use strict';

const { AppError } = require('./app-error');

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { statusCode: 404, code: 'NOT_FOUND' });
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, { statusCode: 409, code: 'CONFLICT' });
  }
}

class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, { statusCode: 500, isOperational: false, code: 'INTERNAL_ERROR' });
  }
}

module.exports = {
  NotFoundError,
  ValidationError,
  ConflictError,
  InternalError,
};
