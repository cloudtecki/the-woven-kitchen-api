'use strict';

const jwt = require('jsonwebtoken');
const { config } = require('../../config');
const { UnauthorizedError } = require('../../shared/errors');

const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new UnauthorizedError('Authentication required'));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { userId: payload.userId, role: payload.role };
  } catch {
    return next(new UnauthorizedError('Authentication required'));
  }

  return next();
};

module.exports = { authenticate };