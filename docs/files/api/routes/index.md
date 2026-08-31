# File Name
`index.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\api\routes\index.js`

# Purpose
The router barrel for the API. It creates an Express `Router` and mounts the individual route modules onto it. Currently it only mounts the health route, but it is the intended aggregation point for all feature routes. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Create an Express `Router` instance.
- Mount feature route routers (`health.routes`) onto it.
- Export the combined router so `app.js` can mount it under `config.apiPrefix`.
- Serve as the single place to register future route modules.

# Exports
- Default export: `router` (CommonJS `module.exports = router`) — an Express `Router`.

# Internal Functions
- None (only the shared `router` instance is created).

# Execution Flow
1. `express.Router()` creates the router.
2. `router.use(require('./health.routes'))` mounts the health-router.
3. `module.exports = router` exports it.
4. In `app.js`, it is mounted via `app.use(config.apiPrefix, apiRoutes)`, so the health route resolves to `GET /api/health`.

# Related Files
- `src/api/routes/health.routes.js` — the currently mounted route module.
- `src/app.js` — mounts this router under `/api`.
- `src/config/index.js` — provides `config.apiPrefix` used at mount time.

# Example Usage
```javascript
// app.js (mounted by the framework):
app.use(config.apiPrefix, require('./api/routes'));
```

# Best Practices
- Add each new feature router here as `router.use(require('./<feature>.routes'))`.
- Keep this file a pure aggregation with no route logic.

# Common Mistakes
- Defining route logic directly in this barrel instead of delegating to route modules.
- Mounting routers directly in `app.js` rather than through this barrel.

# Notes For Frontend Developers
- The router is mounted under `/api`, so the health endpoint is reached at `GET /api/health`.
