# File Name
`app.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\app.js`

# Purpose
Builds and exports the Express application instance. It configures global middleware (security, parsing, compression, logging), mounts the API routes under the configured prefix, serves the Swagger UI, and registers the catch-all not-found and error handlers. Plain JavaScript (CommonJS — `require` / `module.exports`). It does not start the server; that is the job of `server.js`.

# Responsibilities
- Create the Express `app` instance and disable the `x-powered-by` header.
- Apply global middleware in order: Helmet, CORS, compression, JSON body parsing (10mb limit), URL-encoded parsing.
- Apply the request logger only when not in production (`!isProd`).
- Mount the API route router under `config.apiPrefix` (default `/api`).
- Serve Swagger UI at `/api-docs` using the generated `swaggerSpec`.
- Register `notFoundHandler` then `errorHandler` as the final middleware.
- Export the configured `app` instance.

# Exports
- `app` — the fully configured Express application instance (CommonJS `module.exports = app`).

# Internal Functions
- None. This file only wires existing middleware/handlers together; no functions are defined here.

# Execution Flow
1. `express()` creates the app; `app.disable('x-powered-by')` hides the framework header.
2. Global middleware is applied in order (helmet, cors, compression, body parsers).
3. `requestLogger` is mounted only in non-production environments.
4. `app.use(config.apiPrefix, apiRoutes)` mounts the API router.
5. `app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))` serves Swagger UI.
6. `notFoundHandler` then `errorHandler` are mounted last to catch unmatched routes and errors.
7. `module.exports = app` exposes the instance for `server.js` (and tests).

# Related Files
- `src/server.js` — imports `app` and calls `app.listen`.
- `src/config/index.js` — provides `config` (`apiPrefix`) and `isProd`.
- `src/config/swagger.js` — provides `swaggerSpec`.
- `src/api/routes/index.js` — the mounted API router.
- `src/api/middlewares/index.js` — provides `requestLogger`, `errorHandler`, `notFoundHandler`.

# Example Usage
```javascript
const app = require('./app');
// The app is fully wired. It is started in server.js:
// const { config } = require('./config');
// app.listen(config.port, () => { ... });
```

# Best Practices
- Keep `app.js` as a pure wiring/configuration module with no business logic and no side effects other than building the app.
- Mount 404/error handlers as the final middleware, after all routes.
- Conditionally enable request logging so production stays quiet and fast.

# Common Mistakes
- Calling `app.listen` inside `app.js` (this makes tests that import `app` bind a port; `server.js` owns listening).
- Mounting the error handler before routes, so real errors never reach it.
- Forgetting to disable `x-powered-by`, leaking framework info.

# Notes For Frontend Developers
- The API is served under `/api` (configurable via `API_PREFIX`), and Swagger UI is always available at `/api-docs`.
- Unknown routes return `404` JSON (`{ success: false, message: 'Route not found', code: 'NOT_FOUND' }`).
- All failures funnel through the shared error handler producing a consistent `{ success: false, message, code }` envelope.
