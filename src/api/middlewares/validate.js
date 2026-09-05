'use strict';

const { ValidationError } = require('../../shared/errors');

/**
 * Validates request parts against a Zod schema.
 * Usage: validate({ body: createUserSchema })(req, res, next)
 */
const validate = (schemas) => (req, res, next) => {
  const parts = ['params', 'query', 'body'];
  const errors = [];

  parts.forEach((part) => {
    const schema = schemas[part];
    if (!schema) return;

    const result = schema.safeParse(req[part]);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors.push({ field: path || part, message: issue.message });
      });
      return;
    }

    if (part === 'query') {
      Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
    } else {
      req[part] = result.data;
    }
  });

  if (errors.length > 0) {
    next(new ValidationError(errors[0].message, errors));
    return;
  }

  next();
};

module.exports = { validate };
