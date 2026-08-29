# File Name
`validate.middleware.ts`

# File Path
`src/shared/middleware/validate.middleware.ts`

# Purpose
Provides the `validate` middleware factory that validates a request property (`body`, `query`, or `params`) against a Zod schema. On success it attaches the parsed (and possibly type-coerced) data back onto the request so downstream handlers use normalized values; on failure it builds a field-level error map and forwards a `ValidationError` to the error handler.

# Responsibilities
- Accept a `ZodSchema` and a source (`'body' | 'query' | 'params'`, default `'body'`).
- Run `schema.safeParse` on the selected request source.
- On success, replace the request source with the parsed/coerced data and call `next()`.
- On failure, aggregate Zod issues into a `Record<string, string[]>` keyed by dotted field path and pass a `ValidationError` to `next(err)`.

# Dependencies
- `express` — `Request`, `Response`, `NextFunction` types.
- `zod` — `ZodSchema` type used to type and parse the input.
- `../errors` — `ValidationError` for structured validation failures.

# Exports
- `validate` — middleware factory `(schema: ZodSchema, source?: 'body' | 'query' | 'params') => middleware`.

## Function: validate
- Location: `src/shared/middleware/validate.middleware.ts:5`
- Purpose: Validate a request part against a Zod schema, forwarding a structured `ValidationError` on failure or normalized data on success.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `schema` | `ZodSchema` | Yes | The Zod schema used to parse and validate the request data. |
  | `source` | `'body' \| 'query' \| 'params'` | No (default `'body'`) | Which request property to validate and replace. |
- Return Type: `(req: Request, _res: Response, next: NextFunction) => void`.
- Throws: Nothing directly; passes errors to `next(...)` (the returned middleware).
- Called By: Route registration, e.g. `router.post('/', validate(createUserSchema), handler)`.
- Calls (in the returned middleware):
  - `schema.safeParse(req[source])`.
  - Iterates `result.error.issues`.
  - `next(new ValidationError('Validation failed', errors))` on failure.
  - Assigns `req[source] = result.data` on success.
  - `next()` on success.
- Execution Flow (returned middleware):
  1. Call `schema.safeParse(req[source])`.
  2. If `!result.success`:
     - Build `errors: Record<string, string[]>`.
     - For each issue, compute `path = issue.path.join('.')`; push `issue.message` into `errors[path]`.
     - `next(new ValidationError('Validation failed', errors))`; return.
  3. Else (success):
     - Replace `req[source]` with `result.data` (parsed/coerced values).
     - `next()`.
- Example Input: `validate(userCreateSchema)` with a request body `{ name: '' }` where `name` requires `min(1)`.
- Example Output (failure): `next(new ValidationError('Validation failed', { name: ['String must contain at least 1 character(s)'] }))`.
- Example Output (success): `req.body` is replaced with `result.data` (e.g. coerced numbers/strings) and `next()` is called.
- Business Logic: Provides centralized, declarative request validation with a normalized per-field error shape consumable by `ValidationError` → `errorHandler`.
- Edge Cases:
  - `issue.path` may be empty for top-level issues, yielding key `''` — callers should handle an empty path key if schemas validate at root level.
  - Multiple issues on the same field produce an array of messages for that key.
  - `issue.message` comes from Zod and may be in English regardless of client locale.
- Notes: Only validates one source per call; use stacked `validate` calls (or multiple `validate` middlewares) if `body` and `query` both need validation.

# Internal Functions
- `validate` is the sole module-level function/factory (documented above); the returned closure is the actual middleware.

# Execution Flow
1. Route includes `validate(schema, source)` in its middleware chain.
2. The factory returns a middleware that parses `req[source]`.
3. On success, parsed data replaces the raw request field and the next handler runs with cleaned values.
4. On failure, a `ValidationError` (400) is forwarded and normalized by `errorHandler`.

# Related Files
- `src/shared/middleware/index.ts`
- `src/shared/errors/validation.error.ts`
- `src/shared/middleware/error-handler.middleware.ts`
- `src/shared/types/api-response.type.ts` (error/`errors` shape)

# Example Usage
```ts
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/middleware';

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

router.post('/users', validate(createSchema), (req, res) => {
  // req.body is now typed/parsed by the schema
});
```

# Best Practices
- Define Zod schemas as reusable constants and pass them to `validate`.
- Rely on the coalesced `req[source]` (parsed data) instead of re-reading raw values.
- Use the returned per-field `errors` map to drive inline client validation messages.

# Common Mistakes
- Using `schema.parse` instead of `safeParse`, causing an uncaught throw instead of a structured `ValidationError`.
- Validating `query`/`params` without passing `source`, defaulting to `body` and validating the wrong data.
- Ignoring the replaced `req[source]` and re-parsing raw values downstream.
- Forgetting that multiple issues on one field yield an array — client must handle both string and array forms.

# Notes For Frontend Developers
- Validation failures return HTTP 400 with `code: 'VALIDATION_ERROR'` and an `errors` object keyed by field (dotted path for nested fields, e.g. `address.city`), where each value may be a string OR an array of strings.
- Field keys are built from Zod's `issue.path`; render them on the matching input controls.
- On success the server uses the *parsed/coerced* values, so send clean, correctly-typed payloads to avoid surprising coercion mismatches.
