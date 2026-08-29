# File Name
`forbidden.error.ts`

# File Path
`src/shared/errors/forbidden.error.ts`

# Purpose
Defines the `ForbiddenError` class representing an HTTP 403 Forbidden. It signals that the authenticated user lacks permission to perform the requested action on the resource.

# Responsibilities
- Provide a semantic, typed error for 403 Forbidden responses.
- Set `statusCode = 403`, `isOperational = true`, and `code = 'FORBIDDEN'`.
- Provide a sensible default message (`'Forbidden'`).
- Ensure prototype correctness for reliable `instanceof` checks.

# Dependencies
- `./app-error.base` — imports `AppError` and extends it.

# Exports
- `ForbiddenError` — `export class ForbiddenError extends AppError`.

# Internal Functions
- `constructor(message: string = 'Forbidden')` — the only method defined.

## Function: constructor
- Location: `src/shared/errors/forbidden.error.ts:8`
- Purpose: Construct a new operational 403 Forbidden error, defaulting the message to `'Forbidden'`.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `message` | `string` | No (default `'Forbidden'`) | Human-readable explanation of why access is denied. |
- Return Type: `ForbiddenError` (AppError-derived).
- Throws: Nothing explicit.
- Called By: Authorization code paths, e.g. the `authorize` middleware (`'Insufficient permissions'`), and any service enforcing role/ownership rules.
- Calls:
  - `super(message)` — the `AppError` base constructor (fixes prototype, captures stack).
  - `Object.setPrototypeOf(this, ForbiddenError.prototype)` — reinforces instance typing.
- Execution Flow:
  1. Calls the base `AppError` constructor with the (possibly defaulted) message.
  2. Resets the prototype to `ForbiddenError.prototype`.
  3. Inherited `toJSON()` serializes to `{ status: 'error', message, code: 'FORBIDDEN' }`.
- Example Input: `new ForbiddenError()`, `new ForbiddenError('Insufficient permissions')`.
- Example Output: instance with `statusCode === 403`, `isOperational === true`, `code === 'FORBIDDEN'`, `message` as provided.
- Business Logic: Standardised forbidden signalling mapped by the shared error handler to a 403 JSON envelope.
- Edge Cases:
  - Calling with no argument yields the default message `'Forbidden'`.
  - Keep the `readonly` member annotations; they fix the abstract base contract.
- Notes: Uses base `AppError.toJSON()`; no override.

# Execution Flow
1. The `authorize` middleware (or business logic) determines the user lacks the required role.
2. It throws `new ForbiddenError('Insufficient permissions')`.
3. The `errorHandler` sees `instanceof AppError` and `isOperational === true` and responds with status 403 and `err.toJSON()`.

# Related Files
- `src/shared/errors/app-error.base.ts`
- `src/shared/errors/index.ts`
- `src/shared/middleware/auth.middleware.ts`
- `src/shared/middleware/error-handler.middleware.ts`

# Example Usage
```ts
import { ForbiddenError } from '../../shared/errors';

if (actor.role !== 'ADMIN') {
  throw new ForbiddenError('Only administrators can delete users');
}
```

# Best Practices
- Use 403 for authorized-but-insufficient-permission situations, distinctly from `UnauthorizedError` (401, which is about lack of/expired authentication).
- Provide a clear message stating the missing permission or role.

# Common Mistakes
- Confusing 403 `ForbiddenError` with 401 `UnauthorizedError` — 401 means "not authenticated / bad token", 403 means "authenticated but not allowed".
- Throwing `ForbiddenError` for authentication failures instead of `UnauthorizedError`.

# Notes For Frontend Developers
A forbidden response returns HTTP 403:
```json
{ "status": "error", "message": "...", "code": "FORBIDDEN" }
```
Typical client handling: treat the user as logged-in but not permitted; hide/disable the action, optionally showing a permissions error. Do not trigger a re-login (that is for 401).
