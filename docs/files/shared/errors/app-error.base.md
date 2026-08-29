# File Name
`app-error.base.ts`

# File Path
`src/shared/errors/app-error.base.ts`

# Purpose
Defines the abstract base class `AppError` from which all application-specific error classes derive. It standardises operational errors into a common contract (HTTP status code, operational flag, and a stable error code string) and provides a serialization method (`toJSON`) so that the error handler can emit a consistent JSON error body.

# Responsibilities
- Provide an abstract base for all structured application errors.
- Mandate that subclasses define `statusCode`, `isOperational`, and `code`.
- Set up the error prototype chain and stack trace correctly for subclassed errors.
- Provide a default `toJSON()` that serializes an error to a standard `{ status, message, code }` shape.
- Allow subclass `toJSON()` overrides to extend the base serialization.

# Dependencies
No imports at runtime; the class only extends the JavaScript built-in `Error`.

# Exports
- `AppError` — The abstract base error class (exported as `export abstract class AppError extends Error`).

# Internal Functions
- `constructor(message: string)` — Base constructor.
- `toJSON()` — Serializes the error to a plain object.

## Function: constructor
- Location: `src/shared/errors/app-error.base.ts:6`
- Purpose: Initialise a new `AppError` with a human-readable message, fixing the prototype chain and capturing the stack trace at construction.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `message` | `string` | Yes | The human-readable error message. |
- Return Type: `AppError` (instance).
- Throws: Nothing explicit (may throw if the engine cannot capture a stack trace, which is rare).
- Called By: Subclass constructors (e.g. `NotFoundError`, `ForbiddenError`) via `super(message)`.
- Calls:
  - `super(message)` — the built-in `Error` constructor.
  - `Object.setPrototypeOf(this, AppError.prototype)` — fixes `instanceof AppError` for transpiled class hierarchies.
  - `Error.captureStackTrace(this, this.constructor)` — captures a stack trace starting from the subclass constructor.
- Execution Flow:
  1. `Error`'s constructor stores `message` and `name`.
  2. `Object.setPrototypeOf` ensures correct prototype so `err instanceof AppError` works even after transpilation.
  3. `Error.captureStackTrace` captures stack frames excluding the constructor itself.
- Example Input: `new SomeAppError('User already exists')`.
- Example Output: an `AppError`-derived instance with `message === 'User already exists'`.
- Business Logic: Standardises error creation so subclassed errors are correctly typed and carry stack traces.
- Edge Cases:
  - Without `Object.setPrototypeOf`, transpiled ES5-style classes can fail `instanceof AppError`, breaking the error-handler's branch detection.
  - `captureStackTrace` is V8-specific; on other engines it is a no-op fallback.
- Notes: The abstract members are declared but not implemented here; each subclass overrides them with a concrete value.

## Function: toJSON
- Location: `src/shared/errors/app-error.base.ts:12`
- Purpose: Serialize the error into the standard JSON error envelope used by the API error handler.
- Parameters: None.
- Return Type:
  ```ts
  { status: 'error'; message: string; code: string }
  ```
- Throws: Nothing.
- Called By: The `errorHandler` middleware (`res.status(err.statusCode).json(err.toJSON())`) and any subclass `toJSON()` override via `super.toJSON()`.
- Calls: Reads `this.message` and `this.code`; no external calls.
- Execution Flow:
  1. Build an object literal with `status: 'error'`.
  2. Attach `message` from the instance.
  3. Attach `code` from the concrete (abstract member) value.
- Example Input: Instance of `NotFoundError('User')`.
- Example Output: `{ status: 'error', message: 'User not found', code: 'NOT_FOUND' }`.
- Business Logic: Guarantees every `AppError` serializes to the same envelope shape so clients can rely on a uniform error model.
- Edge Cases:
  - Subclasses like `ValidationError` override `toJSON()` to spread `super.toJSON()` and add `errors`; the base shape is preserved.
  - `code` is abstract and thus always defined on a concrete instance.
- Notes: The `status` field is literal-typed `'error'` (`as const`).

# Execution Flow
1. A subclass constructs with a message; base constructor captures stack and fixes prototype.
2. The error is thrown and propagates up to the `errorHandler` middleware.
3. `errorHandler` checks `err instanceof AppError`, whether it is operational, and calls `err.toJSON()` to write the response body.

# Related Files
- `src/shared/errors/not-found.error.ts`
- `src/shared/errors/validation.error.ts`
- `src/shared/errors/unauthorized.error.ts`
- `src/shared/errors/forbidden.error.ts`
- `src/shared/errors/conflict.error.ts`
- `src/shared/errors/internal.error.ts`
- `src/shared/middleware/error-handler.middleware.ts`

# Example Usage
```ts
import { AppError } from '../../shared';

class MyError extends AppError {
  readonly statusCode = 418;
  readonly isOperational = true;
  readonly code = 'MY_CODE';
}
throw new MyError('Something happened');
```

# Best Practices
- Always extend `AppError` rather than throwing generic `Error`s for expected business failures.
- Keep `isOperational = true` for client-facing/expected errors and `false` for unexpected internal failures.
- Use stable, unique `code` strings that clients can switch on.
- Return the structured `toJSON()` shape via the shared error handler.

# Common Mistakes
- Forgetting to call `super(message)` or `Object.setPrototypeOf`, breaking `instanceof` checks.
- Throwing plain `Error` objects, bypassing the standardized envelope.
- Mislabeling `isOperational` so unexpected internal crashes are reported as operational.

# Notes For Frontend Developers
Every structured error the API returns is serialized by `toJSON()`, giving a consistent body:
```json
{ "status": "error", "message": "...", "code": "NOT_FOUND" }
```
The `code` field is the machine-readable identifier (e.g. `VALIDATION_ERROR`, `CONFLICT`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`); handle errors by switching on `code` rather than parsing `message` text.
