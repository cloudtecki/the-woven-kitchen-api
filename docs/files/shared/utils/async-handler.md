# File Name
`async-handler.ts`

# File Path
`src/shared/utils/async-handler.ts`

# Purpose
Provides the `asyncHandler` utility that wraps an async Express route handler so that rejected promises are automatically forwarded to Express's error-handling middleware. Without it, unhandled async rejections in Express 4 would not reach the error handler, leaving requests hanging or crashing.

# Responsibilities
- Wrap an async handler `(req, res, next) => Promise<void>`.
- Catch any rejection and pass it to `next(error)`.
- Return a standard Express middleware that Express can invoke synchronously.
- Eliminate repetitive `try/catch` blocks in route handlers.

# Dependencies
- `express` — `Request`, `Response`, `NextFunction` types.

# Exports
- `asyncHandler` — wrapper function.
- `AsyncFn` — type alias `(req: Request, res: Response, next: NextFunction) => Promise<void>` (internal type, not exported as a named public symbol but defined at module scope).

## Function: asyncHandler
- Location: `src/shared/utils/async-handler.ts:5`
- Purpose: Wrap an async route handler so its rejections are automatically forwarded to `next`, allowing the global error handler to respond appropriately.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `fn` | `AsyncFn` | Yes | The async handler to wrap, signature `(req, res, next) => Promise<void>`. |
- Return Type: `(req: Request, res: Response, next: NextFunction) => void` (a non-async Express middleware).
- Throws: Nothing directly; forwards rejections to `next(...)`.
- Called By: Route handler registration, e.g. `router.get('/', asyncHandler(getAll))`.
- Calls:
  - `fn(req, res, next)` inside `Promise.resolve(...)`.
  - `.catch(next)` to forward any rejection.
- Execution Flow:
  1. Return a middleware function `(req, res, next)`.
  2. Invoke `Promise.resolve(fn(req, res, next))`.
  3. Attach `.catch(next)` so a rejection calls `next(err)`.
  4. Express's error handler then normalizes the error into a response.
- Example Input: `asyncHandler(async (req, res) => { const u = await get(); res.json(u); })`.
- Example Output: a middleware that runs the async logic; if `get()` rejects, `next(err)` is called with that error.
- Business Logic: Bridges async/await route handlers to Express's error-first pipeline, ensuring thrown/rejected errors become structured HTTP responses.
- Edge Cases:
  - If `fn` throws synchronously (not an async rejection), `Promise.resolve(fn(...))` still captures it as a rejected promise and `.catch(next)` forwards it.
  - Handlers that call `next()` themselves are unaffected — the wrapper only adds error forwarding.
- Notes: Works with Express 4 (which does not natively catch async handler rejections).

# Internal Functions
- `asyncHandler` is the sole module-level function; `AsyncFn` is a type alias.

# Execution Flow
1. `asyncHandler(fn)` returns a regular Express middleware.
2. The middleware runs `fn` inside `Promise.resolve(...)`.
3. On rejection, `.catch(next)` forwards the error.
4. `errorHandler` (registered globally) converts it to a JSON response.

# Related Files
- `src/shared/utils/index.ts`
- `src/shared/middleware/error-handler.middleware.ts`

# Example Usage
```ts
import { Router } from 'express';
import { asyncHandler } from '../../shared/utils';

const router = Router();
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await getAllUsers();
    successResponse(res, users);
  })
);
```

# Best Practices
- Wrap every async route handler with `asyncHandler` so rejections never slip through unhandled.
- Let the global `errorHandler` normalize the forwarded error instead of catching in each handler.
- Combine with structured `AppError` subclasses for expected failures.

# Common Mistakes
- Forgetting `asyncHandler`, causing unhandled promise rejections that don't reach the error middleware (Hung requests, process warnings).
- Manually `try/catch`ing inside handlers when the wrapper already forwards errors.
- Wrapping already-synchronous handlers (unnecessary but harmless).

# Notes For Frontend Developers
This is a server-side safety utility with no direct HTTP effect. It guarantees that any thrown server error results in a structured error response (described in `error-handler.middleware.md` / `app-error.base.md`) rather than a hanging or crashing request.
