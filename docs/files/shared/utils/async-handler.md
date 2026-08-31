# File Name
`async-handler.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\shared\utils\async-handler.js`

# Purpose
Provides the `asyncHandler` utility that wraps an async Express route handler so that rejected promises are automatically forwarded to Express's error-handling middleware. Without it, unhandled async rejections in Express 4 would not reach the error handler. Plain JavaScript (CommonJS — `module.exports`).

# Responsibilities
- Wrap an async handler `(req, res, next) => Promise`.
- Catch any rejection and pass it to `next(error)`.
- Return a standard Express middleware Express can invoke synchronously.
- Eliminate repetitive `try/catch` blocks in route handlers.

# Exports
- `asyncHandler` — the wrapper function.

## Function: asyncHandler
- Location: `src/shared/utils/async-handler.js:7`
- Purpose: Wrap an async route handler so its rejections are forwarded to `next`.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `fn` | function | Yes | Async handler, `(req, res, next) => Promise`. |
- Return: An Express middleware `(req, res, next) => void`.
- Throws: Nothing directly; forwards rejections to `next(...)`.
- Called By: Route handler registration, e.g. `router.get('/health', asyncHandler(async (req,res)=>{...}))`.
- Calls: `Promise.resolve(fn(req, res, next))` and `.catch(next)`.
- Execution Flow:
  1. Return a middleware `(req, res, next)`.
  2. Invoke `Promise.resolve(fn(req, res, next))`.
  3. Attach `.catch(next)` so a rejection calls `next(err)`.
  4. Express's error handler then normalizes the error into a response.
- Example Input: `asyncHandler(async (req, res) => { res.json(await get()); })`.
- Example Output: A middleware that runs the async logic; if it rejects, `next(err)` is called.
- Business Logic: Bridges async/await handlers to Express's error pipeline so thrown errors become structured HTTP responses.
- Edge Cases: If `fn` throws synchronously, `Promise.resolve(fn(...))` still captures it as a rejection and `.catch(next)` forwards it. Handlers that call `next()` themselves are unaffected.

# Internal Functions
- `asyncHandler` is the sole module-level function.

# Execution Flow
1. `asyncHandler(fn)` returns a regular Express middleware.
2. The middleware runs `fn` inside `Promise.resolve(...)`.
3. On rejection, `.catch(next)` forwards the error.
4. The global `errorHandler` converts it to a JSON response.

# Related Files
- `src/shared/utils/index.js` — re-exports `asyncHandler`.
- `src/api/routes/health.routes.js` — uses it.
- `src/api/middlewares/error-handler.js` — consumes forwarded errors.

# Example Usage
```javascript
const { asyncHandler } = require('../shared/utils/async-handler');
router.get('/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json(users);
}));
```

# Best Practices
- Wrap every async route handler with `asyncHandler`.
- Let the global `errorHandler` normalize the forwarded error.
- Combine with structured `AppError` subclasses for expected failures.

# Common Mistakes
- Forgetting `asyncHandler`, causing unhandled rejections that don't reach the error middleware.
- Manually `try/catch`ing when the wrapper already forwards errors.

# Notes For Frontend Developers
- A server-side safety utility with no direct HTTP effect; it guarantees thrown server errors become structured responses rather than hanging or crashing requests.
