# File Name
`error-handler.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\api\middlewares\error-handler.js`

# Purpose
Provides the global Express error handler and the 404 not-found handler. The error handler distinguishes operational `AppError` instances from unexpected errors, producing a consistent JSON error envelope. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Handle any error reaching Express and return a structured JSON error body.
- For `AppError`: return `{ success: false, message, code, errors? }` with the error's `statusCode`.
- For unknown errors: log the stack, and return a 500 with `INTERNAL_ERROR` code; expose the raw message/stack only in non-production environments.
- `notFoundHandler`: return a 404 JSON body for unmatched routes.

# Exports
- `errorHandler` — Express error-handling middleware `(err, req, res, next)`.
- `notFoundHandler` — Express middleware `(req, res)`.

## Function: errorHandler
- Location: `src/api/middlewares/error-handler.js:7`
- Purpose: Normalize any error into a consistent JSON response; handle `AppError` specially.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `err` | `Error` / `AppError` | Yes | The error to respond with. |
  | `req` | object | Yes | Express request (unused). |
  | `res` | object | Yes | Express response. |
  | `next` | function | Yes | Express next (unused). |
- Return: `void` (sends a response).
- Throws: Nothing.
- Called By: Express pipeline (mounted last in `app.js`).
- Calls: `logger.error`, `res.status(...).json(...)`.
- Execution Flow:
  1. If `err instanceof AppError`: if not operational, log it; build `{ success:false, message, code }`; add `errors: err.details` if present; send `err.statusCode`.
  2. Otherwise: log as unhandled; `isDev = NODE_ENV !== 'production'`; send 500 with `INTERNAL_ERROR`, using `err.message` (and `stack`) only when `isDev`.
- Example Input: `new NotFoundError()`.
- Example Output: `res.status(404).json({ success:false, message:'Resource not found', code:'NOT_FOUND' })`.
- Business Logic: Standardizes error responses and avoids leaking internals in production.
- Edge Cases: Non-operational `AppError` is logged; unknown errors never expose messages/stacks in production.

## Function: notFoundHandler
- Location: `src/api/middlewares/error-handler.js:33`
- Purpose: Respond with a 404 JSON body for unmatched routes.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `req` | object | Yes | Express request (unused). |
  | `res` | object | Yes | Express response. |
- Return: `void`.
- Throws: Nothing.
- Called By: Express pipeline (mounted before `errorHandler`).
- Calls: `res.status(404).json(...)`.
- Execution Flow: Send `{ success:false, message:'Route not found', code:'NOT_FOUND' }`.
- Example Output: `res.status(404).json({ success:false, message:'Route not found', code:'NOT_FOUND' })`.
- Business Logic: Gives a consistent 404 shape for unknown paths.

# Internal Functions
- None beyond the two exported handlers.

# Execution Flow
- `app.js` mounts `notFoundHandler` then `errorHandler` last, so any unmatched route hits 404, and any thrown/rejected error from earlier middleware is normalized.

# Related Files
- `src/shared/errors/index.js` — provides `AppError`.
- `src/shared/utils/logger.js` — provides `logger`.
- `src/shared/constants/error-codes.js` — `INTERNAL_ERROR`, `NOT_FOUND` codes.

# Example Usage
```javascript
// Usually not invoked directly; it is wired in app.js:
const { errorHandler, notFoundHandler } = require('./api/middlewares');
app.use(notFoundHandler);
app.use(errorHandler);
```

# Best Practices
- Always mount `notFoundHandler` and `errorHandler` after all routes.
- Throw `AppError` subclasses for expected failures so responses stay structured.

# Common Mistakes
- Exposing internal error messages/stacks in production.
- Mounting the error handler before routes.

# Notes For Frontend Developers
- Error responses follow `{ success:false, message, code, errors? }`.
- `code` values map to `ERROR_CODES` (`NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`).
- Unknown/unexpected errors always return HTTP 500 with code `INTERNAL_ERROR`; in production the `message` is generic.
