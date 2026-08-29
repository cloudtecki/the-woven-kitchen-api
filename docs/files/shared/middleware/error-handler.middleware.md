# File Name
`error-handler.middleware.ts`

# File Path
`src/shared/middleware/error-handler.middleware.ts`

# Purpose
Provides the two terminal Express middleware responsible for turning errors into HTTP responses. `errorHandler` is the global error-handling middleware that normalizes both structured `AppError`s and unexpected `Error`s into consistent JSON; `notFoundHandler` responds with a 404 for unmatched routes.

# Responsibilities
- Detect structured `AppError` instances and map them to their `statusCode` with `err.toJSON()`.
- Log non-operational `AppError`s (full detail with stack) before responding.
- Log and respond to any unhandled, non-`AppError` failures with a generic 500, hiding internals in production but exposing the message/stack in development.
- Handle unmatched routes by replying with a 404 `'Route not found'` envelope.

# Dependencies
- `express` — `Request`, `Response`, `NextFunction` types.
- `../errors` — `AppError` base class used for the `instanceof` check.
- `../utils/logger` — `logger` used for error/warn/info logging.

# Exports
- `errorHandler` — Express error-handling middleware `(err, req, res, next) => void`.
- `notFoundHandler` — Express middleware `(req, res) => void`.

## Function: errorHandler
- Location: `src/shared/middleware/error-handler.middleware.ts:5`
- Purpose: Central error handler that converts any thrown error into a consistent JSON HTTP response and logs appropriately.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `err` | `Error` | Yes | The error object passed by Express's error pipeline. |
  | `_req` | `Request` | Yes | Express request (unused). |
  | `res` | `Response` | Yes | Express response; writes the JSON body and status. |
  | `_next` | `NextFunction` | Yes | Express next (unused). |
- Return Type: `void`.
- Throws: Nothing (it terminates the request by writing a response).
- Called By: Express error-handling registration, e.g. `app.use(errorHandler)` (must have 4 args so Express treats it as an error handler).
- Calls:
  - `instanceof AppError` check.
  - `logger.error(...)` when logging non-operational or unhandled errors.
  - `res.status(...).json(...)` to write the response.
  - `err.toJSON()` for structured errors.
- Execution Flow:
  1. If `err instanceof AppError`:
     - If `!err.isOperational`, `logger.error('Non-operational error', { error, stack, code })`.
     - Respond `res.status(err.statusCode).json(err.toJSON())`.
     - Return.
  2. Otherwise (unhandled generic error):
     - `logger.error('Unhandled error', { error: err.message, stack })`.
     - Compute `isDev = process.env.NODE_ENV !== 'production'`.
     - Respond 500 with `{ status:'error', message: isDev ? err.message : 'Internal server error', code:'INTERNAL_ERROR', ...(isDev && { stack }) }`.
- Example Input: `err = new NotFoundError('User')`.
- Example Output: `res.status(404).json({ status:'error', message:'User not found', code:'NOT_FOUND' })`.
- Example Input: `err = new Error('boom')` in production.
- Example Output: `res.status(500).json({ status:'error', message:'Internal server error', code:'INTERNAL_ERROR' })`.
- Business Logic: Distinguishes expected (operational) errors (respond, optionally log) from unexpected ones (log fully, generic response). Debug detail (message + stack) is only exposed in non-production environments.
- Edge Cases:
  - A thrown `AppError` with `isOperational === false` is logged with stack but still returned via `toJSON()`.
  - Non-production builds include `err.message` and a `stack` field in the 500 body (development convenience).
  - Production never leaks the underlying message/stack for unhandled errors.
- Notes: Must NOT have a `next` call, otherwise Express continues to the default handler.

## Function: notFoundHandler
- Location: `src/shared/middleware/error-handler.middleware.ts:38`
- Purpose: Handle any route that was not matched by earlier middleware/routes, returning a 404 JSON response.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `_req` | `Request` | Yes | Express request (unused). |
  | `res` | `Response` | Yes | Express response; writes the 404 body. |
- Return Type: `void`.
- Throws: Nothing.
- Called By: App-level fallback registration, typically the last `app.use(...)` before/after the error handler.
- Calls: `res.status(404).json(...)`.
- Execution Flow:
  1. Respond `res.status(404).json({ status:'error', message:'Route not found', code:'NOT_FOUND' })`.
- Example Input: a request to a nonexistent path, e.g. `GET /api/v1/nope`.
- Example Output: `res.status(404).json({ status:'error', message:'Route not found', code:'NOT_FOUND' })`.
- Business Logic: Provides a structured 404 envelope for unmatched routes instead of Express's default HTML page.
- Edge Cases:
  - A "no route matched" condition is always 404 regardless of HTTP method.
  - Placed after all routes so actual routes take precedence.
- Notes: Uses the same `NOT_FOUND` code as `NotFoundError` for client consistency.

# Internal Functions
- `errorHandler` and `notFoundHandler` are the module-level functions (documented above).

# Execution Flow
1. All route handlers either respond or throw.
2. Express routes any thrown error to `errorHandler` (4-argument signature).
3. `errorHandler` normalizes/l logs/responds; no further middleware runs.
4. `notFoundHandler` catches any request that reached the end of the route stack without a match.

# Related Files
- `src/shared/middleware/index.ts`
- `src/shared/errors/app-error.base.ts` (and all concrete error classes)
- `src/shared/utils/logger.ts`
- `src/app.ts` / main server bootstrap (where `app.use(notFoundHandler)` and `app.use(errorHandler)` are registered)

# Example Usage
```ts
import express from 'express';
import { notFoundHandler, errorHandler } from '../../shared/middleware';

const app = express();
app.use('/api/v1/users', userRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
```

# Best Practices
- Register `notFoundHandler` before `errorHandler` so 404s produce a clean envelope.
- Ensure `errorHandler` is the very last middleware and uses the full 4-parameter signature.
- Use structured `AppError` subclasses for all expected failures so the handler stays thin.

# Common Mistakes
- Using a 3-parameter signature for `errorHandler` — Express won't treat it as an error handler.
- Calling `next()` inside `errorHandler`, bypassing the standardized response.
- Registering `errorHandler` before `notFoundHandler`, which can swallow route-not-found handling.

# Notes For Frontend Developers
- On 5xx (including `INTERNAL_ERROR`), the `message` may be generic in production; do not rely on it for details — only the `code` is stable.
- On 4xx, the `code` tells you the category (`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`), and for validation errors an `errors` object carries per-field messages.
- Use `code` for logic and `message` for display; in development, unhandled 500s include a `stack` field (do not render it in production UI).
