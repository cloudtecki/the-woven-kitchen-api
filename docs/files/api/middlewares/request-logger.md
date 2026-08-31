# File Name
`request-logger.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\api\middlewares\request-logger.js`

# Purpose
Logs every completed HTTP request with method, URL, status code, duration, IP, and user-agent. It is only applied in non-production environments. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Measure request duration using `Date.now()`.
- On response `finish`, log the request summary.
- Choose the log level based on status: `info` (<400), `warn` (400–499), `error` (>=500).
- Call `next()` to continue the pipeline.

# Exports
- `requestLogger` — Express middleware `(req, res, next)`.

## Function: requestLogger
- Location: `src/api/middlewares/request-logger.js:5`
- Purpose: Log request completion metrics without blocking the response.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `req` | object | Yes | Express request. |
  | `res` | object | Yes | Express response. |
  | `next` | function | Yes | Express next. |
- Return: `void`.
- Throws: Nothing.
- Called By: Express pipeline (mounted in `app.js` when `!isProd`).
- Calls: `logger.info` / `logger.warn` / `logger.error`, `res.on('finish', ...)`.
- Execution Flow:
  1. `const start = Date.now()`.
  2. `res.on('finish', ...)` registers a listener that computes `duration` and logs the request summary.
  3. Choose log level by `res.statusCode`.
  4. `next()`.
- Example Input: A GET to `/api/health` returning 200.
- Example Output: `logger.info('Request completed', { method:'GET', url:'/api/health', statusCode:200, duration:'2ms', ip, userAgent })`.
- Business Logic: Uses the `finish` event so metrics capture the actual response, then picks severity by status.
- Edge Cases: If the response is never finished, the `finish` listener does not fire. `res.get('user-agent')` may be `undefined` if the header is absent.

# Internal Functions
- None beyond the exported middleware.

# Execution Flow
- Mounted only when not in production; it wraps each request and logs on completion.

# Related Files
- `src/shared/utils/logger.js` — provides `logger`.
- `src/app.js` — conditionally mounts this middleware via `!isProd`.

# Example Usage
```javascript
// app.js
if (!isProd) {
  app.use(requestLogger);
}
```

# Best Practices
- Keep request logging out of production to avoid overhead, or sample it.
- Let the logger format handle output (dev console vs JSON in production).

# Common Mistakes
- Blocking the event loop with synchronous work in the middleware.
- Logging at `info` for 4xx/5xx instead of using `warn`/`error`.

# Notes For Frontend Developers
- HTTP status codes are surfaced in logs as `4xx` (warn) or `5xx` (error), which helps map client errors vs server errors.
