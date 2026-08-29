# File Name
`internal.error.ts`

# File Path
`src/shared/errors/internal.error.ts`

# Purpose
Defines the `InternalError` class representing an HTTP 500 Internal Server Error. Unlike the other error classes, it is marked as **non-operational** (`isOperational = false`), signaling an unexpected server-side failure rather than an expected business condition.

# Responsibilities
- Provide a semantic, typed error for 500 Internal Server Error responses.
- Set `statusCode = 500`, `isOperational = false`, and `code = 'INTERNAL_ERROR'`.
- Provide a safe default message (`'Internal server error'`) that does not leak internals.
- Ensure prototype correctness for reliable `instanceof` checks.

# Dependencies
- `./app-error.base` — imports `AppError` and extends it.

# Exports
- `InternalError` — `export class InternalError extends AppError`.

# Internal Functions
- `constructor(message: string = 'Internal server error')` — the only method defined.

## Function: constructor
- Location: `src/shared/errors/internal.error.ts:8`
- Purpose: Construct a new 500 error, defaulting the message to the safe `'Internal server error'` string.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `message` | `string` | No (default `'Internal server error'`) | Human-readable message; defaults to a safe, non-leaking message. |
- Return Type: `InternalError` (AppError-derived).
- Throws: Nothing explicit.
- Called By: Catch-all/internal code paths that must surface a 500 while suppressing details.
- Calls:
  - `super(message)` — the `AppError` base constructor (fixes prototype, captures stack).
  - `Object.setPrototypeOf(this, InternalError.prototype)` — reinforces instance typing.
- Execution Flow:
  1. Calls the base `AppError` constructor with the (possibly defaulted) message.
  2. Resets the prototype to `InternalError.prototype`.
  3. Inherited `toJSON()` serializes to `{ status: 'error', message, code: 'INTERNAL_ERROR' }`.
- Example Input: `new InternalError()` or `new InternalError('Could not reach database')`.
- Example Output: instance with `statusCode === 500`, `isOperational === false`, `code === 'INTERNAL_ERROR'`.
- Business Logic: Because `isOperational` is `false`, the `errorHandler` logs the full error (with stack and code) before responding, but the response body is still a generic 500 envelope.
- Edge Cases:
  - Default message hides implementation details from clients, which is intentional for security.
  - Non-operational status means internal logging always occurs in `errorHandler`.
- Notes: `InternalError` is the only non-operational error class in the shared set. It uses base `AppError.toJSON()`.

# Execution Flow
1. Some unexpected internal path throws `new InternalError(...)`.
2. The `errorHandler` recognises `instanceof AppError`, sees `isOperational === false`, logs `error`, `stack`, and `code`, and responds with status 500 and `err.toJSON()`.

# Related Files
- `src/shared/errors/app-error.base.ts`
- `src/shared/errors/index.ts`
- `src/shared/middleware/error-handler.middleware.ts`

# Example Usage
```ts
import { InternalError } from '../../shared/errors';

try {
  await someUnexpectedOperation();
} catch (e) {
  throw new InternalError();
}
```

# Best Practices
- Use `InternalError` only for genuine, unexpected failures; prefer specific operational errors for expected business conditions.
- Rely on the default message to avoid leaking internal details to clients.
- Let non-operational errors trigger error-logging in `errorHandler` to aid diagnostics.

# Common Mistakes
- Using `InternalError` for expected business failures (those should be specific operational errors).
- Passing sensitive internal details (stack traces, database errors) into the message that gets sent to clients.

# Notes For Frontend Developers
An internal error returns HTTP 500:
```json
{ "status": "error", "message": "Internal server error", "code": "INTERNAL_ERROR" }
```
The message is deliberately generic and never contains internals. Client handling: surface a generic "Something went wrong" and support retrying later; the actual cause is only in server logs.
