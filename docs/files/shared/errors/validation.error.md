# File Name
`validation.error.ts`

# File Path
`src/shared/errors/validation.error.ts`

# Purpose
Defines the `ValidationError` class representing an HTTP 400 Bad Request caused by invalid input. It extends the standard error envelope with a field-level `errors` map so clients can display per-field validation messages.

# Responsibilities
- Provide a semantic, typed error for 400 validation failures.
- Set `statusCode = 400`, `isOperational = true`, and `code = 'VALIDATION_ERROR'`.
- Carry a `Record<string, string | string[]>` of field-level error messages.
- Override `toJSON()` to include the `errors` map alongside the base `{ status, message, code }` shape.
- Ensure prototype correctness for reliable `instanceof` checks.

# Dependencies
- `./app-error.base` — imports `AppError` and extends it.

# Exports
- `ValidationError` — `export class ValidationError extends AppError`.

# Internal Functions
- `constructor(message: string, errors?: Record<string, string | string[]>)` — class constructor.
- `toJSON()` — overridden serialization.

## Function: constructor
- Location: `src/shared/errors/validation.error.ts:9`
- Purpose: Construct a new 400 validation error with a summary message and a per-field errors map.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `message` | `string` | Yes | High-level validation summary (e.g. `'Validation failed'`). |
  | `errors` | `Record<string, string \| string[]>` | No (default `{}`) | Map of field path to human-readable message(s). |
- Return Type: `ValidationError` (AppError-derived).
- Throws: Nothing explicit.
- Called By: The `validate` middleware (`new ValidationError('Validation failed', errors)`) and any manual validation logic.
- Calls:
  - `super(message)` — the `AppError` base constructor (fixes prototype, captures stack).
  - Assigns `this.errors = errors`.
  - `Object.setPrototypeOf(this, ValidationError.prototype)` — reinforces instance typing.
- Execution Flow:
  1. Calls the base constructor with the summary message.
  2. Stores the field-level `errors` map on the instance.
  3. Resets the prototype to `ValidationError.prototype`.
- Example Input: `new ValidationError('Validation failed', { email: ['Email is required'], age: 'Must be a number' })`.
- Example Output: instance with `statusCode === 400`, `code === 'VALIDATION_ERROR'`, `errors` populated.
- Business Logic: Bundles summary + field errors so clients can both show a generic banner and inline per-field messages.
- Edge Cases:
  - `errors` defaults to an empty object when omitted.
  - Values may be a single string or an array of strings (multiple issues per field).
- Notes: Because this class declares `readonly errors`, the property is set once in the constructor.

## Function: toJSON
- Location: `src/shared/errors/validation.error.ts:15`
- Purpose: Serialize the error to the standard envelope while additionally including the field-level `errors` map.
- Parameters: None.
- Return Type:
  ```ts
  { status: 'error'; message: string; code: string; errors: Record<string, string | string[]> }
  ```
- Throws: Nothing.
- Called By: The `errorHandler` middleware when writing the 400 response body.
- Calls:
  - `super.toJSON()` — the base `AppError.toJSON()` yielding `{ status, message, code }`.
- Execution Flow:
  1. Call `super.toJSON()` to get the base envelope.
  2. Spread that envelope.
  3. Add `errors: this.errors`.
- Example Input: instance with `errors = { email: ['Email is required'] }`.
- Example Output:
  ```json
  { "status": "error", "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": { "email": ["Email is required"] } }
  ```
- Business Logic: Extends the inherited envelope without losing the standard `status`/`message`/`code` fields.
- Edge Cases:
  - Returns `errors: {}` when the map is empty.
  - Uses `this.errors` (the stored map) rather than re-deriving it.
- Notes: Uses `override` keyword to explicitly override the base `toJSON`.

# Execution Flow
1. The `validate` middleware parses the request with a Zod schema.
2. On failure it builds a field-path → messages map and throws `new ValidationError('Validation failed', errors)`.
3. The `errorHandler` sees `instanceof AppError`, `isOperational === true`, and writes `res.status(400).json(err.toJSON())` — which includes the `errors` map.

# Related Files
- `src/shared/errors/app-error.base.ts`
- `src/shared/errors/index.ts`
- `src/shared/middleware/validate.middleware.ts`
- `src/shared/middleware/error-handler.middleware.ts`

# Example Usage
```ts
import { ValidationError } from '../../shared/errors';

throw new ValidationError('Validation failed', {
  email: 'A valid email is required',
  password: ['Must be at least 8 characters', 'Must contain a number'],
});
```

# Best Practices
- Use `ValidationError` for all input-validation failures (Zod middleware or manual checks).
- Populate the `errors` map with both a user-facing summary and per-field messages.
- Use the `validate` middleware to auto-generate the errors map from the Zod schema.

# Common Mistakes
- Using `ValidationError` for 404/409/401/403 conditions.
- Putting arbitrary non-field keys into the `errors` map, which clients may not know how to render.
- Omitting the summary `message`, which leaves clients without a top-level hint.

# Notes For Frontend Developers
A validation failure returns HTTP 400:
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": { "email": ["Email is required"] }
}
```
The `errors` object is keyed by field name (dotted path if nested, e.g. `address.city`) with either a string or an array of strings. Render each key inline under its input; show `message` as a general banner.
