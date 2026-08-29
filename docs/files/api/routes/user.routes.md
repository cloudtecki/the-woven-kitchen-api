# File Name
user.routes.ts

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\api\routes\user.routes.ts`

# Purpose
Defines the HTTP routing layer for the User resource. It creates a dedicated Express `Router`, maps each REST endpoint (GET list, GET by id, POST create, PUT update, DELETE) to the corresponding controller handler in `user.controller.ts`, and applies request validation middleware (`validate`) against DTO schemas before the handler runs. The router is exported as `userRouter` and mounted at `/users` via the routes aggregator.

# Responsibilities
- Create a `Router()` for user endpoints.
- Bind HTTP verbs/paths to controller functions:
  - `GET /` → `getAllUsers`
  - `GET /:id` → `getUserById`
  - `POST /` → `createUser`
  - `PUT /:id` → `updateUser`
  - `DELETE /:id` → `deleteUser`
- Attach the `validate` middleware with the appropriate DTO schema and target location (`query`, `params`, `body`) to each route before the handler.
- Export the configured router as `userRouter`.

# Dependencies
- `express` (named import `Router`): Creates the router instance used to register routes.
- `../controllers/user.controller` (named exports `getAllUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`): Controller functions that handle each endpoint's business logic.
- `../../shared/middleware` (named export `validate`): Validation middleware factory. `validate(schema, source)` validates the request's query/params/body against a Zod schema.
- `../../application/dto/user.dto` (named exports `createUserSchema`, `updateUserSchema`, `userQuerySchema`, `userIdParamsSchema`): Zod schemas describing valid shapes for create/update bodies, list query params, and user-id path params respectively.

# Exports
- `userRouter` — the configured Express `Router` (named export alias of the `router` instance).

# Internal Functions
- None. `user.routes.ts` only constructs and configures the router; every handler is imported and reused.

# Execution Flow
1. Import `Router`, controller handlers, `validate`, and the four user DTO schemas.
2. Create `const router = Router()`.
3. Register routes in this order:
   - `router.get('/', validate(userQuerySchema, 'query'), getAllUsers)`
   - `router.get('/:id', validate(userIdParamsSchema, 'params'), getUserById)`
   - `router.post('/', validate(createUserSchema, 'body'), createUser)`
   - `router.put('/:id', validate(userIdParamsSchema, 'params'), validate(updateUserSchema, 'body'), updateUser)`
   - `router.delete('/:id', validate(userIdParamsSchema, 'params'), deleteUser)`
4. For each request, the validated middleware runs first; if it fails, validation responds and the handler is skipped. If it passes, the controller executes.
5. Export `router as userRouter`.
6. The aggregator (`routes/index.ts`) mounts it at `/users`, and `app.ts` mounts the aggregator at `/api`, so final paths are `/api/users`, `/api/users/:id`, etc.

# Related Files
- `src/api/routes/index.ts` — mounts `userRouter` at `/users`.
- `src/api/controllers/user.controller.ts` — provides the controller functions bound to these routes.
- `src/shared/middleware` — provides the `validate` middleware used here.
- `src/application/dto/user.dto.ts` — provides the Zod DTO schemas used for validation.

# Example Usage
```typescript
// Mounting in the aggregator
import { userRouter } from './user.routes';
router.use('/users', userRouter);
```
Request examples:
- `GET /api/users?page=1&limit=20`
- `GET /api/users/507f1f77bcf86cd799439011`
- `POST /api/users` with `{ "email": "a@b.com", "name": "Ada", "role": "STAFF" }`
- `PUT /api/users/507f1f77bcf86cd799439011` with `{ "name": "Ada L", "isActive": true }`
- `DELETE /api/users/507f1f77bcf86cd799439011`

# Best Practices
- Keep routes declarative and minimal: verb + path + handlers. Move all logic to controllers/handlers.
- Validate every input surface — path params, query strings, and bodies — using the `validate` middleware.
- Apply the strictest appropriate schema; for `PUT /:id`, validate both params and body.
- Use a feature-scoped router per resource and aggregate them centrally for clean separation.

# Common Mistakes
- Forgetting to validate path params (`:id`), allowing malformed ids to reach the handler.
- Applying body validation to routes that have no body (e.g., GET/DELETE).
- Missing `validate` on a body-bearing route, passing unvalidated data to the handler.
- Ordering the generic `GET /` before `/GET /:id` incorrectly (correct here: `/` registered first, but Express matches exact path first, so no shadowing as written).
- Exporting the router under the wrong name, breaking the aggregator import.

# Notes For Frontend Developers
- The complete user API surface is:
  - `GET /api/users` (paginated list; query params `page`, `limit`)
  - `GET /api/users/:id` (single user)
  - `POST /api/users` (create; expects `email`, `name`, `role`)
  - `PUT /api/users/:id` (update; accepts `name`, `role`, `isActive`)
  - `DELETE /api/users/:id` (remove)
- All requests pass through validation; a validation failure returns an error (typically `VALIDATION_ERROR`) before the handler executes, so invalid payloads never reach business logic.
- The `:id` path parameter must conform to the `userIdParamsSchema` (typically a valid Mongo ObjectId).
- These endpoints are documented in Swagger under the `Users` tag.
