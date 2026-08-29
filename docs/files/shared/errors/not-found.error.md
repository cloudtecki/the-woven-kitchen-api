# File Name
`not-found.error.ts`

# File Path
`src/shared/errors/not-found.error.ts`

# Purpose
Defines the `NotFoundError` class representing an HTTP 404 Not Found. It is used when a requested resource (e.g. a user, document, or route target) does not exist.

# Responsibilities
- Provide a semantic, typed error for 404 Not Found responses.
- Set `statusCode = 404`, `isOperational = true`, and `code = 'NOT_FOUND'`.
- Conveniently auto-format the message as `"${resource} not found"` from a supplied resource name.
- Ensure prototype correctness for reliable `instanceof` checks.

# Dependencies
- `./app-error.base` — imports `AppError` and extends it.

# Exports
- `NotFoundError` — `export class NotFoundError extends AppError`.

# Internal Functions
- `constructor(resource: string)` — the only method defined.

## Function: constructor
- Location: `src/shared/errors/not-found.error.ts:8`
- Purpose: Construct a new 404 error whose message is derived from the resource name.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `resource` | `string` | Yes | The name of the missing entity (singular), e.g. `'User'`. |
- Return Type: `NotFoundError` (AppError-derived).
- Throws: Nothing explicit.
- Called By: Application/service/repository layers when a lookup yields no result.
- Calls:
  - `super(\`${resource} not found\`)` — the `AppError` base constructor; the message is interpolated as e.g. `"User not found"`.
  - `Object.setPrototypeOf(this, NotFoundError.prototype)` — reinforces instance typing.
- Execution Flow:
  1. Formats the message as `${resource} not found`.
  2. Calls the base constructor.
  3. Resets the prototype to `NotFoundError.prototype`.
  4. Inherited `toJSON()` serializes to `{ status: 'error', message: 'User not found', code: 'NOT_FOUND' }`.
- Example Input: `new NotFoundError('User')`.
- Example Output: instance with `statusCode === 404`, `isOperational === true`, `code === 'NOT_FOUND'`, `message === 'User not found'`.
- Business Logic: Standardised 404 signalling; the message is derived from the entity name for consistency.
- Edge Cases:
  - Passing an empty string yields the odd message `' not found'`; callers should always pass a meaningful resource name.
  - Case/punctuation of the resource name is passed through verbatim.
- Notes: No `toJSON` override; uses base `AppError.toJSON()`.

# Execution Flow
1. A service/repository finds no record for the requested identifier.
2. It throws `new NotFoundError('User')`.
3. The `errorHandler` recognises `instanceof AppError`, sees `isOperational === true`, and responds with status 404 and `err.toJSON()`.

# Related Files
- `src/shared/errors/app-error.base.ts`
- `src/shared/errors/index.ts`
- `src/shared/middleware/error-handler.middleware.ts`

# Example Usage
```ts
import { NotFoundError } from '../../shared/errors';

const user = await userRepo.findById(id);
if (!user) {
  throw new NotFoundError('User');
}
```

# Best Practices
- Pass a human-friendly resource name so the message reads naturally (`'Order'` → `'Order not found'`).
- Use 404 for missing resources, not for validation (400) or permission issues (403).

# Common Mistakes
- Passing a full message instead of a resource name (which would double-format, e.g. `'User not found not found'`).
- Using `NotFoundError` where a `ValidationError` or `ForbiddenError` is actually the correct semantic.

# Notes For Frontend Developers
A not-found response returns HTTP 404:
```json
{ "status": "error", "message": "User not found", "code": "NOT_FOUND" }
```
Client handling: treat the entity as nonexistent (e.g. redirect to a list view or show "Not found"), and do not retry the same request.
