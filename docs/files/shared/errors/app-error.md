# File Name
`app-error.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\shared\errors\app-error.js`

# Purpose
Defines the base application error class. All operational errors extend `AppError` so the global error handler can respond with a consistent JSON shape. Plain JavaScript (CommonJS — `module.exports`).

# Responsibilities
- Provide a base `Error` subclass carrying `statusCode`, `isOperational`, `code`, and optional `details`.
- Preserve a proper stack trace via `Error.captureStackTrace`.

# Exports
- `AppError` — the base error class.

## Class: AppError
- Location: `src/shared/errors/app-error.js:8`
- Purpose: Base class for all application errors.
- Constructor Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `message` | `string` | Yes | Human-readable error message. |
  | `options` | object | No | `{ statusCode=500, isOperational=true, code='INTERNAL_ERROR', details }`. |
- Return: `AppError` instance.
- Throws: Nothing.
- Called By: Subclass constructors and direct `new AppError(...)` use.
- Calls: `super(message)`, `Error.captureStackTrace(this, this.constructor)`.
- Execution Flow:
  1. Call `super(message)`.
  2. Set `name = this.constructor.name`.
  3. Set `statusCode`, `isOperational`, `code`, `details` from options.
  4. `Error.captureStackTrace(this, this.constructor)`.
- Example Input: `new AppError('msg', { statusCode: 400, code: 'VALIDATION_ERROR', details })`.
- Example Output: An `AppError` with `message`, `statusCode:400`, `code:'VALIDATION_ERROR'`, `isOperational:true`.
- Business Logic: Distinguishes operational (expected) from non-operational (programming/infrastructure) errors for logging decisions.
- Edge Cases: `details` is `undefined` unless supplied; `code` defaults to `'INTERNAL_ERROR'`; `isOperational` defaults `true`.

# Internal Functions
- None beyond the class.

# Execution Flow
- Custom errors subclass `AppError`; the global `errorHandler` checks `err instanceof AppError` to shape responses.

# Related Files
- `src/shared/errors/custom-errors.js` — subclasses `AppError`.
- `src/shared/errors/index.js` — re-exports `AppError`.
- `src/api/middlewares/error-handler.js` — consumes `AppError`.

# Example Usage
```javascript
const { AppError } = require('../shared/errors');
throw new AppError('Something failed', { statusCode: 400, code: 'VALIDATION_ERROR' });
```

# Best Practices
- Extend `AppError` for all expected/operational failures.
- Set `isOperational: false` for unexpected programming errors that should be logged loudly.

# Common Mistakes
- Throwing plain `Error` objects, which bypass the structured error shape.
- Forgetting to set `statusCode`/`code`.

# Notes For Frontend Developers
- Not directly part of the API surface, but every structured error response originates from `AppError`/its subclasses, carrying `code` and `message`.
