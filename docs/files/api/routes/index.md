# File Name
index.ts (routes)

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\api\routes\index.ts`

# Purpose
The route aggregation layer for the API. It creates the top-level Express `Router` and mounts each feature router onto it under its resource prefix. Currently it mounts the user feature router at `/users`. This module is imported by `app.ts` and mounted under the `/api` prefix, forming the complete `/api/users/...` endpoint paths.

# Responsibilities
- Create a new `Router()` instance.
- Mount the `userRouter` onto the router under the `/users` path prefix.
- Export the aggregated `router` for consumption by `app.ts`.
- Act as a single extension point where new feature routers (future resources) would be added.

# Dependencies
- `express` (named import `Router`): The Express router factory used to create the aggregated router instance.
- `./user.routes` (named export `userRouter`): The feature router containing all user CRUD routes; mounted at `/users`.

# Exports
- `router` — the aggregated Express `Router` instance (named export).

# Internal Functions
- None. `index.ts` only constructs a router and mounts sub-routers; there are no functions.

# Execution Flow
1. Import `Router` from express and `userRouter` from `./user.routes`.
2. Create `const router = Router()`.
3. Register `router.use('/users', userRouter)` so all `/users` sub-paths delegate to `userRouter`.
4. Export `router`.
5. `app.ts` imports this `router` and mounts it at `/api` with `app.use('/api', router)`, yielding final paths like `/api/users`.

# Related Files
- `src/app.ts` — imports `router` and mounts it at `/api`.
- `src/api/routes/user.routes.ts` — provides the `userRouter` mounted here.
- Feature-specific routes (future files) that would be added here as additional `router.use(...)` calls.

# Example Usage
```typescript
// Exporting the aggregated router
export { router };
```
```typescript
// In app.ts
import { router } from './api/routes';
app.use('/api', router);
```

# Best Practices
- Keep routing thin: only aggregate feature routers; put per-resource route definitions in dedicated route files.
- Use a single mount point pattern so adding a new feature is a one-line change here plus a new feature router.
- Centralize prefix definitions here so route mounting stays consistent and navigable.

# Common Mistakes
- Forgetting to export `router`, causing `app.ts` to fail to find it.
- Mounting routers under conflicting prefixes, producing ambiguous endpoint paths.
- Adding route logic (controllers/handlers) here instead of delegating to feature routers, bloating the aggregation layer.
- Importing from the wrong path when the feature router file structure changes.

# Notes For Frontend Developers
- All routes mounted here become API endpoints under the `/api` base prefix (e.g., `/api/users`).
- This file typically has no API-visible behavior of its own; it only composes sub-routers.
- To see the full listing of available/undocumented endpoints, reference the Swagger docs at `/api/docs`.
