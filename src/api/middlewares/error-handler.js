'use strict';

const { AppError } = require('../../shared/errors');
const { logger } = require('../../shared/utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error', { error: err.message, stack: err.stack, code: err.code });
    }
    const body = {
      success: false,
      message: err.message,
      code: err.code,
    };
    if (err.details) body.errors = err.details;
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    success: false,
    message: isDev ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack }),
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
};

module.exports = { errorHandler, notFoundHandler };
