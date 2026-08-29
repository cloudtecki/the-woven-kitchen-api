# File Name
`conflict.error.ts`

# File Path
`src/shared/errors/conflict.error.ts`

# Purpose
Defines the `ConflictError` class representing an HTTP 409 Conflict. It is used when a request cannot be processed because of a conflict with the current state of the resource (e.g. a duplicate unique field, an already-existing record, or a version mismatch).

# Responsibilities
- Provide a semantic, typed error for 409 Conflict responses.
- Set `statusCode = 409`, `isOperational = true`, and `code = 'CONFLICT'`.
- Ensure prototype correctness so `instanceof ConflictError` works reliably.

# Dependencies
- `./app-error.base` — imports `AppError` and extends it.

# Exports
- `ConflictError` — `export class ConflictError extends AppError`.

# Internal Functions
- `constructor(message: string)` — the only method defined.

## Function: constructor
- Location: `src/shared/errors/conflict.error.ts:8`
- Purpose: Construct a new operational 409 Conflict error with a message.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `message` | `string` | Yes | Human-readable explanation of the conflict. |
- Return Type: `ConflictError` (AppError-derived).
- Throws: Nothing explicit.
- Called By: Application code/service/repository layers when a conflict occurs (e.g. duplicate email during user creation).
- Calls:
  - `super(message)` — the `AppError` base constructor (fixes prototype, captures stack).
  - `Object.setPrototypeOf(this, ConflictError.prototype)` — reinforces instance typing.
- Execution Flow:
  1. Calls the base `AppError` constructor with the message.
  2. Resets the prototype to `ConflictError.prototype`.
  3. Inherited `toJSON()` serializes to `{ status: 'error', message, code: 'CONFLICT' }`.
- Example Input: `new ConflictError('Email already registered')`.
- Example Output: instance with `statusCode === 409`, `isOperational === true`, `code === 'CONFLICT'`.
- Business Logic: Standardised conflict signalling used by the shared error handler to write a 409 JSON envelope.
- Edge Cases:
  - Can be thrown with empty string; handlers still emit `code: 'CONFLICT'` and status 409.
  - Non-Abstract members must remain as class properties; do not remove the `readonly` annotations.
- Notes: No `toJSON` override, so it uses the base `AppError.toJSON()`.

# Execution Flow
1. A service detects a state conflict.
2. It throws `new ConflictError(message)`.
3. The `errorHandler` recognises `instanceof AppError`, sees `isOperational === true`, and responds with `status 409` and `err.toJSON()`.

# Related Files
- `src/shared/errors/app-error.base.ts`
- `src/shared/errors/index.ts`
- `src/shared/middleware/error-handler.middleware.ts`

# Example Usage
```ts
import { ConflictError } from '../../shared/errors';

if (await userRepo.findByEmail(email)) {
  throw new ConflictError(`User with email ${email} already exists`);
}
```

# Best Practices
- Use `ConflictError` only for genuine state/resource conflicts (409), not validation problems (use `ValidationError`, 400) or unauthorized access (401/403).
- Provide a clear message describing the conflicting attribute.

# Common Mistakes
- Using `ConflictError` for validation failures or duplicate checks that are better represented as `ValidationError`.
- Not passing a descriptive message, making debugging harder.

# Notes For Frontend Developers
A conflict returns HTTP 409 with:
```json
{ "status": "error", "message": "...", "code": "CONFLICT" }
```
Typical client handling: warn the user about the conflicting value (e.g. "This email is already taken") and prompt them to change it, rather than retrying blindly.
