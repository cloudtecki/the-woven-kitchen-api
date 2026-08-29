# File Name
`request-logger.middleware.ts`

# File Path
`src/shared/middleware/request-logger.middleware.ts`

# Purpose
Provides the `requestLogger` Express middleware that logs every HTTP request/response cycle. It records method, URL, status code, duration, client IP, and user agent, routing entries to the appropriate log level (`error` for ≥500, `warn` for ≥400, `info` otherwise).

# Responsibilities
- Time each request from start to response finish.
- Capture HTTP metadata (method, URL, status code, duration, IP, user agent).
- Emit the entry at the correct level based on the response status:
  - `error` for 5xx,
  - `warn` for 4xx,
  - `info` for everything else.
- Hand off to the next middleware immediately (logging happens asynchronously on `res 'finish'`).

# Dependencies
- `express` — `Request`, `Response`, `NextFunction` types.
- `../utils/logger` — `logger` used to emit request log entries.

# Exports
- `requestLogger` — Express middleware `(req, res, next) => void`.

## Function: requestLogger
- Location: `src/shared/middleware/request-logger.middleware.ts:4`
- Purpose: Log a structured entry per completed request/response cycle at a level determined by the response status code.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `req` | `Request` | Yes | Express request; reads `req.method`, `req.originalUrl`, `req.ip`, `req.get('user-agent')`. |
  | `res` | `Response` | Yes | Express response; reads `res.statusCode` and listens for the `finish` event. |
  | `next` | `NextFunction` | Yes | Called to continue to the next middleware/handler. |
- Return Type: `void`.
- Throws: Nothing.
- Called By: App-level registration, e.g. `app.use(requestLogger)` (typically early in the chain).
- Calls:
  - `res.on('finish', ...)` to schedule logging.
  - `logger.error(...)`, `logger.warn(...)`, or `logger.info(...)`.
  - `next()`.
- Execution Flow:
  1. Record `start = Date.now()`.
  2. Attach a `finish` listener on `res`.
  3. Call `next()` immediately (so the request is not blocked).
  4. When the response finishes: compute `duration = Date.now() - start` and build `logData` { method, url, statusCode, duration: `${duration}ms`, ip, userAgent }.
  5. Choose level: `statusCode >= 500` → `logger.error`; `>= 400` → `logger.warn`; else → `logger.info`, each with message `'Request completed'` and `logData`.
- Example Input: A `GET /api/v1/users` call that returns 200.
- Example Output: `logger.info('Request completed', { method: 'GET', url: '/api/v1/users', statusCode: 200, duration: '45ms', ip: '::1', userAgent: '...' })`.
- Business Logic: Centralized request observability; status-code-based severity helps ops filter for failures.
- Edge Cases:
  - If the response never fires `finish` (client disconnect mid-stream), the listener may not run and nothing is logged.
  - `req.get('user-agent')` may be `undefined` if the header is absent; the value is passed through as-is.
  - Uses `res.on('finish')` (fired after the response is handed off to the OS) rather than `close`, so normal completions are captured.
- Notes: Logging is asynchronous relative to the request lifecycle — `next()` runs before the log is written.

# Internal Functions
- `requestLogger` is the sole module-level function (documented above).

# Execution Flow
1. `requestLogger` is registered early in the Express pipeline.
2. For each request it records a start time and registers a `finish` listener.
3. Control passes to downstream middleware immediately via `next()`.
4. When the response finishes, a structured log entry is emitted at the severity matching the status code.

# Related Files
- `src/shared/middleware/index.ts`
- `src/shared/utils/logger.ts`

# Example Usage
```ts
import express from 'express';
import { requestLogger } from '../../shared/middleware';

const app = express();
app.use(requestLogger);
app.use('/api/v1', apiRoutes);
```

# Best Practices
- Register `requestLogger` as the first middleware so every route benefits from request logging.
- Ensure it is placed before routes so `req.originalUrl` reflects the full path.
- Let `logger` handle format/transport concerns; this middleware only decides severity.

# Common Mistakes
- Registering `requestLogger` after routes, so many requests bypass logging.
- Logging synchronously inside the middleware (blocking the response) instead of using `res.on('finish')`.
- Comparing status codes in the wrong order or missing the `>= 400` branch.

# Notes For Frontend Developers
This middleware only affects server-side logs; it never alters response bodies. It can help operators correlate client-observed 4xx/5xx responses with server log entries (same method/URL/statusCode, plus request duration and IP).
