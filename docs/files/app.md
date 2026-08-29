# File Name
app.ts

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\app.ts`

# Purpose
The central Express application factory file. It constructs and configures the Express `app` instance by chaining global middleware, mounting the API router and Swagger documentation UI, defining the health-check endpoint, and attaching the global not-found and error handlers. This is the single composition root for all HTTP-level concerns of the backend, isolating Express configuration from server startup logic (`server.ts`).

# Responsibilities
- Create and export the singleton `app` instance of `Express`.
- Apply global middleware in the correct order:
  - `helmet` for secure HTTP headers.
  - `cors` to enable cross-origin requests.
  - `compression` to gzip HTTP responses.
  - `express.json({ limit: '10mb' })` to parse JSON bodies up to 10 MB.
  - `express.urlencoded({ extended: true })` to parse URL-encoded bodies.
  - `requestLogger` to log incoming requests.
- Mount the Swagger UI at `/api/docs` using the precompiled `swaggerSpec` from `./config/swagger.config`, with `explorer` enabled and a custom site title.
- Mount all API routes under the `/api` prefix using the aggregated `router` from `./api/routes`.
- Define the `/health` endpoint that reports the application and database (Mongoose connection) status, with Swagger documentation embedded in a JSDoc comment.
- Mount the `notFoundHandler` at the end of all routes to catch unmatched paths.
- Mount the `errorHandler` as the final error-handling middleware.

# Dependencies
- `express` (named import `express`, `{ Express }`): The core web framework used to create the app instance and define request/response handling. `Express` is used only as a type annotation for the `app` variable.
- `cors`: Middleware that enables Cross-Origin Resource Sharing so the API can accept requests from other origins (e.g., a separate frontend domain).
- `helmet`: Middleware that sets a variety of HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) to protect against common web vulnerabilities.
- `compression`: Middleware that compresses HTTP response bodies using gzip/deflate to reduce payload size over the wire.
- `swagger-ui-express`: Serves the interactive Swagger/OpenAPI documentation UI. `swaggerUi.serve` provides static assets, and `swaggerUi.setup(spec, opts)` injects the spec.
- `mongoose`: The MongoDB ODM. Here only its `connection` state is used to determine database connectivity for the health check.
- `./api/routes` (named export `router`): The aggregated Express router combining all feature routers (e.g., user routes) mounted under `/users`.
- `./shared/middleware` (named exports `errorHandler`, `notFoundHandler`, `requestLogger`): Shared Express middleware — `errorHandler` centralizes error responses, `notFoundHandler` returns 404 for unknown routes, and `requestLogger` logs each request.
- `./config/swagger.config` (named export `swaggerSpec`): The precompiled OpenAPI 3.0 specification object generated at module load, used to render the Swagger UI.

# Exports
- `app` — the configured `Express` application instance (named export).

# Internal Functions
- None. `app.ts` contains only module-level configuration and the inline health-check callback (not a named/exported function).

# Execution Flow
1. At module load, the `app` constant is created via `express()`.
2. Global middleware is applied in sequence via successive `app.use(...)` calls (helmet → cors → compression → json → urlencoded → requestLogger).
3. Swagger UI is mounted at `/api/docs`.
4. The aggregated API router is mounted at `/api`.
5. The `GET /health` route is registered.
6. `notFoundHandler` and `errorHandler` are mounted as terminal middleware.
7. The `app` is exported and consumed by `server.ts`, which listens on a port and starts the HTTP server.

# Related Files
- `server.ts` — imports `app` and calls `app.listen(...)` to start the server; also handles graceful shutdown.
- `src/config/swagger.config.ts` — provides `swaggerSpec` used by this file.
- `src/api/routes/index.ts` — provides the aggregated `router` mounted at `/api`.
- `src/shared/middleware` — provides `errorHandler`, `notFoundHandler`, and `requestLogger`.
- `src/config/index.ts` — provides configuration consumed indirectly through the Swagger config and elsewhere; `server.ts` uses the same config.

# Example Usage
```typescript
// In server.ts
import { app } from './app';

const server = app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

# Best Practices
- Keep `app.ts` free of business logic; it should only wire middleware, routes, and handlers.
- Apply middleware in the correct order: security headers and request parsing before routing, error handlers last.
- Set explicit JSON body size limits (`limit: '10mb'`) to prevent abuse.
- Use environment-injected config (via `config`) rather than hardcoding values where possible.
- Export the configured app so it can be reused for testing (e.g., supertest) without binding to a port.

# Common Mistakes
- Mounting `errorHandler` before routes, which would swallow all request handling.
- Reordering middleware so that body parsing happens after a route consumes the stream.
- Placing `notFoundHandler`/`errorHandler` before the routes, causing every request to return 404 or an error.
- Registering the health route after the JSON/urlencoded parsers but forgetting that it receives a request without a body — not an issue here, but worth noting for consistency.
- Importing from `./shared/middleware` with an explicit file path that does not exist (must rely on the resolution of `middleware/index` or the `middleware` barrel).

# Notes For Frontend Developers
- The API base prefix is `/api`; all feature endpoints (e.g., `/api/users`) are reachable under it.
- Interactive API documentation is served at `/api/docs` (Swagger UI), which lists the `/health` endpoint under the `System` tag and user endpoints under the `Users` tag.
- The `/health` endpoint returns `200` with `{ status: 'ok', database: 'connected', timestamp }` when healthy, or `503` with `database: 'disconnected'` when the database is unreachable. Useful for uptime checks and monitoring tools.
- The JSON and URL-encoded body parsers accept up to 10 MB of request body data.
- Responses are compressed with gzip automatically when the client advertises support, so large payloads arrive smaller.

---

## Function: (health endpoint callback — inline)
- Location: `src/app.ts:52`
- Purpose: Handles the `GET /health` route; reports whether the service and its MongoDB connection are healthy based on Mongoose's connection `readyState`.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `_req` | `Request` | Yes | The incoming Express request. Unused (prefixed with `_`), since a health check needs no input. |
| `res` | `Response` | Yes | The Express response used to send the health status JSON. |

- Return Type: `void` (sends the HTTP response directly).
- Throws: Does not throw; it reads `mongoose.connection.readyState` synchronously and always responds.
- Called By: Express router when a `GET /health` request arrives.
- Calls:
  - `mongoose.connection.readyState` (reads connection state).
  - `res.status(...)` and `res.json(...)`.
- Execution Flow:
  1. Read `mongoose.connection.readyState`.
  2. Determine `dbConnected = readyState === 1` (1 means connected).
  3. Respond with `200`/`ok`/`connected` when connected, otherwise `503`/`error`/`disconnected`.
  4. Include an ISO timestamp of the current time.
- Example Input: `GET /health` with no query or body.
- Example Output: `200` with body `{ "status": "ok", "database": "connected", "timestamp": "2026-08-27T10:00:00.000Z" }`.
- Business Logic: Exposes a lightweight liveness/readiness endpoint that couples API availability with database connectivity, signalling `503` when the database is down.
- Edge Cases:
  - Database connecting, connecting (state `2`), or disconnected (state `0`) — all yield `503`.
  - A database connection error will not throw here; it simply reports `disconnected`.
- Notes: The `_req` parameter is intentionally unused; the underscore prefix signals this to linting tools.
