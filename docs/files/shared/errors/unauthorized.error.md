# File Name
`unauthorized.error.ts`

# File Path
`src/shared/errors/unauthorized.error.ts`

# Purpose
Defines the `UnauthorizedError` class representing an HTTP 401 Unauthorized. It signals that the request lacks valid authentication credentials (no token, malformed token, or an expired/invalid token).

# Responsibilities
- Provide a semantic, typed error for 401 Unauthorized responses.
- Set `statusCode = 401`, `isOperational = true`, and `code = 'UNAUTHORIZED'`.
- Provide a sensible default message (`'Unauthorized'`).
- Ensure prototype correctness for reliable `instanceof` checks.

# Dependencies
- `./app-error.base` — imports `AppError` and extends it.

# Exports
- `UnauthorizedError` — `export class UnauthorizedError extends AppError`.

# Internal Functions
- `constructor(message: string = 'Unauthorized')` — the only method defined.

## Function: constructor
- Location: `src/shared/errors/unauthorized.error.ts:8`
- Purpose: Construct a new operational 401 error, defaulting the message to `'Unauthorized'`.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `message` | `string` | No (default `'Unauthorized'`) | Human-readable explanation of the auth failure. |
- Return Type: `UnauthorizedError` (AppError-derived).
- Throws: Nothing explicit.
- Called By: The `authenticate` middleware (`'No token provided'`, `'Invalid or expired token'`, `'Not authenticated'`) and any authentication code path.
- Calls:
  - `super(message)` — the `AppError` base constructor (fixes prototype, captures stack).
  - `Object.setPrototypeOf(this, UnauthorizedError.prototype)` — reinforces instance typing.
- Execution Flow:
  1. Calls the base `AppError` constructor with the (possibly defaulted) message.
  2. Resets the prototype to `UnauthorizedError.prototype`.
  3. Inherited `toJSON()` serializes to `{ status: 'error', message, code: 'UNAUTHORIZED' }`.
- Example Input: `new UnauthorizedError('No token provided')` or `new UnauthorizedError()`.
- Example Output: instance with `statusCode === 401`, `isOperational === true`, `code === 'UNAUTHORIZED'`.
- Business Logic: Standardised 401 signalling for authentication failures, mapped by the shared error handler to a 401 JSON envelope.
- Edge Cases:
  - No-argument construction yields the default `'Unauthorized'` message.
  - Keep the `readonly` member annotations; they satisfy the abstract base contract.
- Notes: Uses base `AppError.toJSON()`; no override.

# Execution Flow
1. The `authenticate` middleware validates the `Authorization` header and JWT.
2. On any failure it throws `new UnauthorizedError(...)`.
3. The `errorHandler` sees `instanceof AppError` and `isOperational === true` and responds with status 401 and `err.toJSON()`.

# Related Files
- `src/shared/errors/app-error.base.ts`
- `src/shared/errors/index.ts`
- `src/shared/middleware/auth.middleware.ts`
- `src/shared/middleware/error-handler.middleware.ts`

# Example Usage
```ts
import { UnauthorizedError } from '../../shared/errors';

if (!token) {
  throw new UnauthorizedError('No token provided');
}
```

# Best Practices
- Use 401 strictly for authentication failures (missing/expired/invalid credentials).
- Distinguish 401 (`UnauthorizedError`) from 403 (`ForbiddenError`): 401 = not authenticated; 403 = authenticated but not allowed.

# Common Mistakes
- Using `UnauthorizedError` for permission problems (should be `ForbiddenError`).
- Throwing `UnauthorizedError` for validation or business-logic failures.

# Notes For Frontend Developers
An unauthorized response returns HTTP 401:
```json
{ "status": "error", "message": "...", "code": "UNAUTHORIZED" }
```
Client handling: treat as a failed/expired session — clear stored credentials and prompt the user to log in again (typically by redirecting to the login page).
