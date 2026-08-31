# File Name
`custom-errors.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\shared\errors\custom-errors.js`

# Purpose
Defines ready-made, specialized error classes that extend the base `AppError` with preset HTTP status codes and error codes. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Provide typed error classes for common failure cases.
- Preset `statusCode` and `code` per class so callers throw with minimal boilerplate.

# Exports
- `NotFoundError` — 404, code `NOT_FOUND`.
- `ValidationError` — 400, code `VALIDATION_ERROR` (accepts `details`).
- `ConflictError` — 409, code `CONFLICT`.
- `InternalError` — 500, non-operational, code `INTERNAL_ERROR`.

# Internal Functions
- None (four exported classes).

## Class: NotFoundError
- Purpose: Signal a missing resource.
- Constructor: `message = 'Resource not found'`.
- Sets `{ statusCode: 404, code: 'NOT_FOUND' }`.

## Class: ValidationError
- Purpose: Signal invalid request data.
- Constructor: `message = 'Validation failed'`, optional `details`.
- Sets `{ statusCode: 400, code: 'VALIDATION_ERROR', details }`.

## Class: ConflictError
- Purpose: Signal a resource conflict (e.g. duplicate).
- Constructor: `message = 'Resource already exists'`.
- Sets `{ statusCode: 409, code: 'CONFLICT' }`.

## Class: InternalError
- Purpose: Signal an unexpected internal failure.
- Constructor: `message = 'Internal server error'`.
- Sets `{ statusCode: 500, isOperational: false, code: 'INTERNAL_ERROR' }`.

# Execution Flow
- Each class is a thin `AppError` subclass; instances are thrown by application/route code and handled by the global `errorHandler`.

# Related Files
- `src/shared/errors/app-error.js` — base class.
- `src/shared/errors/index.js` — re-exports these.
- `src/api/middlewares/error-handler.js` and `validate.js` — consumers.

# Example Usage
```javascript
const { NotFoundError, ValidationError } = require('../shared/errors');
throw new NotFoundError('User not found');
throw new ValidationError('Validation failed', [{ field: 'email', message: 'Invalid email' }]);
```

# Best Practices
- Throw these specific classes instead of raw `AppError` or plain `Error`.
- Pass field-level `details` to `ValidationError` for richer client feedback.

# Common Mistakes
- Misusing `InternalError` for expected failures (it is non-operational and treated as severe).
- Throwing generic errors and losing the structured status/code.

# Notes For Frontend Developers
- Each class maps to a concrete HTTP status + `code`: 404/`NOT_FOUND`, 400/`VALIDATION_ERROR` (with an `errors` array), 409/`CONFLICT`, 500/`INTERNAL_ERROR`.
