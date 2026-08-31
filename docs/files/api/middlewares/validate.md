# File Name
`validate.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\api\middlewares\validate.js`

# Purpose
Provides a Zod-based request validation middleware factory. It validates `params`, `query`, and/or `body` against provided Zod schemas and, on failure, passes a `ValidationError` to the Express error handler. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Accept a `schemas` object keyed by part (`params`, `query`, `body`).
- Return an Express middleware `(req, res, next)`.
- Validate each provided part with `schema.safeParse`.
- Collect field-level errors and, if any, call `next(new ValidationError('Validation failed', errors))`.
- On success, replace `req[part]` with the parsed (coerced) data and call `next()`.

# Exports
- `validate` — middleware factory `(schemas) => (req, res, next)`.

## Function: validate
- Location: `src/api/middlewares/validate.js:9`
- Purpose: Build a validation middleware from Zod schemas for request parts.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `schemas` | `{ params?, query?, body? }` | Yes | Zod schemas keyed by request part. |
- Return: Express middleware `(req, res, next) => void`.
- Throws: Nothing directly (forwards `ValidationError` to `next`).
- Called By: Route registration, e.g. `router.post('/', validate({ body: createSchema }), handler)`.
- Calls: `schema.safeParse(...)`, `next(new ValidationError(...))`.
- Execution Flow:
  1. Iterate parts `['params','query','body']`; skip parts with no schema.
  2. For each part, `result = schema.safeParse(req[part])`.
  3. On failure, push `{ field: <path>, message }` per issue; on success, `req[part] = result.data`.
  4. If errors exist, `next(new ValidationError('Validation failed', errors))`; else `next()`.
- Example Input: `validate({ body: userCreateSchema })`.
- Example Output: A middleware that 400s with `ValidationError` on bad input, or replaces `req.body` with parsed data and calls `next()`.
- Business Logic: Centralizes validation and normalizes errors into the shared `ValidationError` shape.
- Edge Cases: `issue.path` empty → `field` falls back to the part name. `req[part]` replaced only on success (data coercion).

# Internal Functions
- None beyond the exported factory.

# Execution Flow
- Route middleware order: normalizes then validates request data; invalid data is short-circuited to the error handler.

# Related Files
- `src/shared/errors/index.js` — provides `ValidationError`.
- `src/application/dto` (empty scaffolding) — where future Zod schemas will be defined.

# Example Usage
```javascript
const { validate } = require('./api/middlewares');
const { z } = require('zod');

const userCreateSchema = z.object({ email: z.string().email(), name: z.string().min(1) });
router.post('/users', validate({ body: userCreateSchema }), handler);
```

# Best Practices
- Define schemas in the DTO layer and reuse them here.
- Validate only the parts actually used by the route.

# Common Mistakes
- Forgetting to validate `query`/`params` (not just `body`).
- Relying on unvalidated `req.body` in handlers.

# Notes For Frontend Developers
- Validation failures return HTTP 400 with `code: 'VALIDATION_ERROR'` and an `errors` array of `{ field, message }` entries.
