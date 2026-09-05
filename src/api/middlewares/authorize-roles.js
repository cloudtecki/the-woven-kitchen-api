'use strict';

const { ForbiddenError, UnauthorizedError } = require('../../shared/errors');

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ForbiddenError('Access denied'));
  }

  return next();
};

module.exports = { authorizeRoles };