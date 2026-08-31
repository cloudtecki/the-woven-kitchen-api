# File Name
`health.routes.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\api\routes\health.routes.js`

# Purpose
Defines the health-check route `GET /health`, which returns `{ "status": "OK" }`. It is mounted under `/api` by the routes barrel, so the full path is `GET /api/health`. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Create an Express `Router` holding the health-check endpoint.
- Respond `200` with a JSON body `{ status: 'OK' }`.
- Wrap the async handler with `asyncHandler` so any future rejection is forwarded to the error handler.

# Exports
- Default export: `router` (CommonJS `module.exports = router`) — an Express `Router`.

# Internal Functions
- None exported; the route handler is defined inline (an async arrow function wrapped by `asyncHandler`).

# Execution Flow
1. `express.Router()` creates the router.
2. `router.get('/health', asyncHandler(async (req, res) => { res.status(200).json({ status: 'OK' }); }))` registers the GET handler.
3. Under `/api` mount, the full path is `GET /api/health`.

# Related Files
- `src/api/routes/index.js` — mounts this router.
- `src/shared/utils/async-handler.js` — wraps the handler.
- `src/app.js` — ultimately serves it at `/api`.

# Example Usage
```javascript
// Request
GET /api/health

// Response (200)
{ "status": "OK" }
```

# Best Practices
- Keep the health endpoint minimal and dependency-free so it always reflects liveness.
- Use `asyncHandler` for consistency with other routes.

# Common Mistakes
- Adding heavy logic (DB pings) that could make the health check fail spuriously.

# Notes For Frontend Developers
- Use `GET /api/health` as a liveness probe. A `200` with `{ status: 'OK' }` means the service is up.
- The swagger spec references this endpoint (schema `Health`).
