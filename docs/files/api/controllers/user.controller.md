# File Name
user.controller.ts

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\api\controllers\user.controller.ts`

# Purpose
The HTTP controller (presentation layer) for the User resource. It translates incoming Express requests into application-layer commands/queries (CQRS), resolves the corresponding handler from the dependency-injection container, executes it, and formats the response using shared response helpers. It is the thin adapter between Express HTTP and the application use cases, containing no business logic itself.

# Responsibilities
- Provide per-endpoint controller functions: `getAllUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`.
- Resolve the correct application handler from the Inversify-style `container` using token constants (`TYPES.*`).
- Translate request data (`req.query`, `req.params`, `req.body`) into typed command/query objects.
- Execute each handler and format results with shared helpers (`paginatedResponse`, `successResponse`, `createdResponse`).
- Wrap handler execution with `asyncHandler` so thrown errors propagate to the central error middleware.
- Embed per-endpoint Swagger JSDoc annotations for automatic documentation generation.

# Dependencies
- `express` (named imports `Request`, `Response`): Type definitions for the incoming request and outgoing response objects.
- `../../infrastructure/di` (named export `container`): The dependency-injection container used to resolve handlers by token.
- `../../shared/constants/tokens` (named export `TYPES`): Symbol/string constants used as DI container binding tokens (e.g., `TYPES.GetUserByIdHandler`).
- `../../shared/utils` (named exports `asyncHandler`, `successResponse`, `createdResponse`, `paginatedResponse`): Shared helpers to wrap async handlers and format success/created/paginated responses consistently.
- `../../application/handlers/create-user.handler` (class `CreateUserHandler`): Handles the create-user use case.
- `../../application/handlers/update-user.handler` (class `UpdateUserHandler`): Handles the update-user use case.
- `../../application/handlers/delete-user.handler` (class `DeleteUserHandler`): Handles the delete-user use case.
- `../../application/handlers/get-user-by-id.handler` (class `GetUserByIdHandler`): Handles the get-user-by-id use case.
- `../../application/handlers/get-all-users.handler` (class `GetAllUsersHandler`): Handles the get-all-users (paginated) use case.
- `../../application/commands/create-user.command` (class `CreateUserCommand`): Value object carrying create-user input.
- `../../application/commands/update-user.command` (class `UpdateUserCommand`): Value object carrying update-user input.
- `../../application/commands/delete-user.command` (class `DeleteUserCommand`): Value object carrying delete-user input.
- `../../application/queries/get-user-by-id.query` (class `GetUserByIdQuery`): Value object carrying get-by-id query input.
- `../../application/queries/get-all-users.query` (class `GetAllUsersQuery`): Value object carrying paginated list query input.
- `../../application/dto/user.dto` (type-only imports `CreateUserInput`, `UpdateUserInput`, `UserQueryInput`, `UserIdParamsInput`): TypeScript input types for request data.

# Exports
- `getAllUsers` — controller for paginated user list.
- `getUserById` — controller for a single user by id.
- `createUser` — controller for creating a user.
- `updateUser` — controller for updating a user.
- `deleteUser` — controller for deleting a user.

# Internal Functions
- `getUserByIdHandler()` — module-private resolver returning `GetUserByIdHandler` from the container (line 17).
- `getAllUsersHandler()` — module-private resolver returning `GetAllUsersHandler` from the container (line 18).
- `createUserHandler()` — module-private resolver returning `CreateUserHandler` from the container (line 19).
- `updateUserHandler()` — module-private resolver returning `UpdateUserHandler` from the container (line 20).
- `deleteUserHandler()` — module-private resolver returning `DeleteUserHandler` from the container (line 21).
These are small factory closures that lazily fetch the handler from the container each time a request is served.

# Execution Flow
1. A request hits a route in `user.routes.ts`, passes `validate` middleware, then arrives at one of the exported controllers.
2. The controller reads the relevant request data (query/params/body) cast to the DTO input type.
3. It invokes the corresponding module-private handler resolver to obtain the handler instance from the container.
4. It constructs a command or query object with the request data.
5. It `await`s the handler's `.execute(...)` to run the use case.
6. It formats the result via `paginatedResponse` / `successResponse` / `createdResponse` (e.g., `201` for create, `200` otherwise).
7. Any thrown error is caught by `asyncHandler` and forwarded to the central error middleware.

# Related Files
- `src/api/routes/user.routes.ts` — binds these controllers to URL paths and validates input.
- `src/api/routes/index.ts` — aggregates the user router under `/users`.
- `src/application/handlers/*` — the use-case handlers executed here.
- `src/application/commands/*` and `src/application/queries/*` — CQRS value objects built here.
- `src/application/dto/user.dto.ts` — input type definitions.
- `src/shared/utils` — response/async helpers.
- `src/infrastructure/di` and `src/shared/constants/tokens.ts` — DI resolution.

# Example Usage
A `POST /api/users` request with body `{ "email": "ada@example.com", "name": "Ada", "role": "STAFF" }` flows to `createUser`, which resolves `CreateUserHandler`, executes `new CreateUserCommand(...)`, and replies `201` with the created user. A `GET /api/users?page=2&limit=10` flows to `getAllUsers`, which executes `new GetAllUsersQuery(2, 10)` and replies with paginated data.

# Best Practices
- Keep controllers thin: parse request, build command/query, delegate to handler, format response. No business logic here.
- Resolve handlers via the container using tokens so dependencies are injectable and testable.
- Use shared response helpers for consistent error-free success payloads across controllers.
- Wrap handlers with `asyncHandler` so every async rejection is routed to the central error middleware instead of crashing the process.
- Cast request data to DTO input types for type safety (validation is guaranteed earlier by route middleware).

# Common Mistakes
- Embedding business logic or direct data-access calls in the controller instead of delegating to handlers.
- Instantiating handlers with `new` rather than resolving from the container, breaking DI/decoupling.
- Not wrapping with `asyncHandler`, causing unhandled promise rejections on handler errors.
- Forgetting to cast `req.body`/`req.params`/`req.query` to the DTO input type, losing compile-time safety.
- Returning inconsistent response shapes instead of using the shared response helpers.

# Notes For Frontend Developers
- Responses from these controllers use a consistent envelope produced by the shared helpers: success data plus optional message; create returns `201`; errors are handled centrally as `{ status, message, code, errors }`.
- The paginated list response includes `data`, `page`, `limit`, `total`, and `totalPages` — useful for building paginated tables.
- Delete returns a success envelope with `null` data and a `'User deleted successfully'` message.
- All endpoints are documented in Swagger under the `Users` tag.
- Request validation is enforced upstream in the route middleware, so frontends should send well-formed `page`/`limit` queries, valid Mongo ObjectId path params, and valid bodies to avoid `VALIDATION_ERROR` responses.

---

## Function: getUserByIdHandler
- Location: `src/api/controllers/user.controller.ts:17`
- Purpose: Module-private factory that resolves the `GetUserByIdHandler` from the DI container by its token, deferred until invocation.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| (none) | — | — | No arguments. |

- Return Type: `GetUserByIdHandler`
- Throws: Propagates any error thrown by `container.get(...)` (e.g., if the binding is missing).
- Called By: `getUserById` controller (line 75).
- Calls: `container.get<GetUserByIdHandler>(TYPES.GetUserByIdHandler)`.
- Execution Flow: Returns `container.get<GetUserByIdHandler>(TYPES.GetUserByIdHandler)` immediately.
- Example Input: None.
- Example Output: An instance of `GetUserByIdHandler`.
- Business Logic: Decouples controller from handler instantiation by delegating to the DI container.
- Edge Cases: If the DI binding for `TYPES.GetUserByIdHandler` is not registered, `container.get` throws at request time.
- Notes: Resolved per request; container may return a singleton or fresh instance depending on binding scope.

## Function: getAllUsersHandler
- Location: `src/api/controllers/user.controller.ts:18`
- Purpose: Module-private factory that resolves the `GetAllUsersHandler` from the DI container by token.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| (none) | — | — | No arguments. |

- Return Type: `GetAllUsersHandler`
- Throws: Propagates any error thrown by `container.get(...)`.
- Called By: `getAllUsers` controller (line 46).
- Calls: `container.get<GetAllUsersHandler>(TYPES.GetAllUsersHandler)`.
- Execution Flow: Returns `container.get<GetAllUsersHandler>(TYPES.GetAllUsersHandler)`.
- Example Input: None.
- Example Output: An instance of `GetAllUsersHandler`.
- Business Logic: Fetches the list-query handler via the container.
- Edge Cases: Missing DI binding causes a throw at call time.
- Notes: Deferred resolution keeps the controller decoupled.

## Function: createUserHandler
- Location: `src/api/controllers/user.controller.ts:19`
- Purpose: Module-private factory that resolves the `CreateUserHandler` from the DI container by token.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| (none) | — | — | No arguments. |

- Return Type: `CreateUserHandler`
- Throws: Propagates any error thrown by `container.get(...)`.
- Called By: `createUser` controller (line 109).
- Calls: `container.get<CreateUserHandler>(TYPES.CreateUserHandler)`.
- Execution Flow: Returns `container.get<CreateUserHandler>(TYPES.CreateUserHandler)`.
- Example Input: None.
- Example Output: An instance of `CreateUserHandler`.
- Business Logic: Provides the create use-case handler via the container.
- Edge Cases: Missing DI binding causes a throw at call time.
- Notes: Deferred resolution.

## Function: updateUserHandler
- Location: `src/api/controllers/user.controller.ts:20`
- Purpose: Module-private factory that resolves the `UpdateUserHandler` from the DI container by token.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| (none) | — | — | No arguments. |

- Return Type: `UpdateUserHandler`
- Throws: Propagates any error thrown by `container.get(...)`.
- Called By: `updateUser` controller (line 136).
- Calls: `container.get<UpdateUserHandler>(TYPES.UpdateUserHandler)`.
- Execution Flow: Returns `container.get<UpdateUserHandler>(TYPES.UpdateUserHandler)`.
- Example Input: None.
- Example Output: An instance of `UpdateUserHandler`.
- Business Logic: Provides the update use-case handler via the container.
- Edge Cases: Missing DI binding causes a throw at call time.
- Notes: Deferred resolution.

## Function: deleteUserHandler
- Location: `src/api/controllers/user.controller.ts:21`
- Purpose: Module-private factory that resolves the `DeleteUserHandler` from the DI container by token.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| (none) | — | — | No arguments. |

- Return Type: `DeleteUserHandler`
- Throws: Propagates any error thrown by `container.get(...)`.
- Called By: `deleteUser` controller (line 162).
- Calls: `container.get<DeleteUserHandler>(TYPES.DeleteUserHandler)`.
- Execution Flow: Returns `container.get<DeleteUserHandler>(TYPES.DeleteUserHandler)`.
- Example Input: None.
- Example Output: An instance of `DeleteUserHandler`.
- Business Logic: Provides the delete use-case handler via the container.
- Edge Cases: Missing DI binding causes a throw at call time.
- Notes: Deferred resolution.

## Function: getAllUsers
- Location: `src/api/controllers/user.controller.ts:44`
- Purpose: Handles `GET /api/users`; runs the get-all-users handler and responds with a paginated result.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `req` | `Request` | Yes | The Express request; `req.query` carries `page` and `limit`, cast to `UserQueryInput`. |
| `res` | `Response` | Yes | The Express response used to send the paginated payload. |

- Return Type: `Promise<void>` (wrapped by `asyncHandler`).
- Throws: Propagates errors from the handler (caught by `asyncHandler`).
- Called By: Express route `GET /` in `user.routes.ts` (after validation).
- Calls: `getAllUsersHandler().execute(new GetAllUsersQuery(page, limit))`, then `paginatedResponse(res, result.data, {...})`.
- Execution Flow:
  1. Destructure `{ page, limit }` from `req.query` cast as `UserQueryInput`.
  2. Resolve `getAllUsersHandler()`.
  3. `await handler.execute(new GetAllUsersQuery(page, limit))`.
  4. Call `paginatedResponse(res, result.data, { page, limit, total, totalPages })`.
- Example Input: `GET /api/users?page=1&limit=20` → `page = 1`, `limit = 20`.
- Example Output: `200` with `{ data: [...users], page: 1, limit: 20, total: 42, totalPages: 3 }`.
- Business Logic: Coordinates the paginated user-list query across the application layer.
- Edge Cases: Missing/NaN pagination values — validation middleware ensures shape; handler applies defaults if needed.
- Notes: The full response envelope is built by `paginatedResponse`.

## Function: getUserById
- Location: `src/api/controllers/user.controller.ts:73`
- Purpose: Handles `GET /api/users/:id`; runs the get-user-by-id handler and responds with the found user.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `req` | `Request` | Yes | `req.params.id` holds the user id, cast to `UserIdParamsInput`. |
| `res` | `Response` | Yes | The response used to send the user payload. |

- Return Type: `Promise<void>` (wrapped by `asyncHandler`).
- Throws: Propagates handler errors (e.g., `UserNotFoundException` → later mapped to 404); caught by `asyncHandler`.
- Called By: Express route `GET /:id` in `user.routes.ts`.
- Calls: `getUserByIdHandler().execute(new GetUserByIdQuery(id))`, then `successResponse(res, user)`.
- Execution Flow:
  1. Read `{ id }` from `req.params` cast as `UserIdParamsInput`.
  2. Resolve `getUserByIdHandler()`.
  3. `await handler.execute(new GetUserByIdQuery(id))`.
  4. `successResponse(res, user)`.
- Example Input: `GET /api/users/507f1f77bcf86cd799439011` → `id = '507f1f77bcf86cd799439011'`.
- Example Output: `200` with `{ status: 'success', data: { id, email, name, role, isActive, createdAt, updatedAt } }`.
- Business Logic: Retrieves a single user by id; missing user results in a not-found error handled centrally.
- Edge Cases: Invalid/malformed id already blocked by route validation; non-existent id → 404-style error.
- Notes: Response shape generated by `successResponse`.

## Function: createUser
- Location: `src/api/controllers/user.controller.ts:107`
- Purpose: Handles `POST /api/users`; runs the create-user handler and responds with `201`.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `req` | `Request` | Yes | `req.body` holds create data cast to `CreateUserInput` (`email`, `name`, `role`). |
| `res` | `Response` | Yes | The response used to send the created user payload. |

- Return Type: `Promise<void>` (wrapped by `asyncHandler`).
- Throws: Propagates handler errors (e.g., duplicate email → 409); caught by `asyncHandler`.
- Called By: Express route `POST /` in `user.routes.ts`.
- Calls: `createUserHandler().execute(new CreateUserCommand(data.email, data.name, data.role))`, then `createdResponse(res, user, 'User created successfully')`.
- Execution Flow:
  1. Read `data = req.body as CreateUserInput`.
  2. Resolve `createUserHandler()`.
  3. `await handler.execute(new CreateUserCommand(data.email, data.name, data.role))`.
  4. `createdResponse(res, user, 'User created successfully')`.
- Example Input: `POST /api/users` body `{ "email": "a@b.com", "name": "Ada", "role": "STAFF" }`.
- Example Output: `201` with `{ status: 'success', message: 'User created successfully', data: {...created user} }`.
- Business Logic: Orchestrates user creation via the command handler; duplicate detection handled lower in the stack.
- Edge Cases: Duplicate email → conflict (409); validation failures handled by route middleware (400).
- Notes: Uses `createdResponse` for the `201` status.

## Function: updateUser
- Location: `src/api/controllers/user.controller.ts:133`
- Purpose: Handles `PUT /api/users/:id`; runs the update-user handler and responds with the updated user.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `req` | `Request` | Yes | `req.params.id` (cast to `UserIdParamsInput`) and `req.body` (cast to `UpdateUserInput` with `name`, `role`, `isActive`). |
| `res` | `Response` | Yes | The response used to send the updated user payload. |

- Return Type: `Promise<void>` (wrapped by `asyncHandler`).
- Throws: Propagates handler errors (e.g., user not found → 404); caught by `asyncHandler`.
- Called By: Express route `PUT /:id` in `user.routes.ts`.
- Calls: `updateUserHandler().execute(new UpdateUserCommand(id, data.name, data.role, data.isActive))`, then `successResponse(res, user, 'User updated successfully')`.
- Execution Flow:
  1. Read `{ id }` from params and `data` from body (cast to `UpdateUserInput`).
  2. Resolve `updateUserHandler()`.
  3. `await handler.execute(new UpdateUserCommand(id, data.name, data.role, data.isActive))`.
  4. `successResponse(res, user, 'User updated successfully')`.
- Example Input: `PUT /api/users/507f1f77bcf86cd799439011` body `{ "name": "Ada L", "isActive": false }`.
- Example Output: `200` with `{ status: 'success', message: 'User updated successfully', data: { ...updated user } }`.
- Business Logic: Orchestrates partial/full user update via the update command.
- Edge Cases: Non-existent id → 404; omitted optional fields remain unchanged (depends on handler/DTO defaults).
- Notes: Uses `successResponse` (200).

## Function: deleteUser
- Location: `src/api/controllers/user.controller.ts:160`
- Purpose: Handles `DELETE /api/users/:id`; runs the delete-user handler and responds with a success envelope and `null` data.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `req` | `Request` | Yes | `req.params.id` holds the user id, cast to `UserIdParamsInput`. |
| `res` | `Response` | Yes | The response used to send the deletion confirmation. |

- Return Type: `Promise<void>` (wrapped by `asyncHandler`).
- Throws: Propagates handler errors (e.g., user not found → 404); caught by `asyncHandler`.
- Called By: Express route `DELETE /:id` in `user.routes.ts`.
- Calls: `deleteUserHandler().execute(new DeleteUserCommand(id))`, then `successResponse(res, null, 'User deleted successfully')`.
- Execution Flow:
  1. Read `{ id }` from `req.params` cast as `UserIdParamsInput`.
  2. Resolve `deleteUserHandler()`.
  3. `await handler.execute(new DeleteUserCommand(id))`.
  4. `successResponse(res, null, 'User deleted successfully')`.
- Example Input: `DELETE /api/users/507f1f77bcf86cd799439011`.
- Example Output: `200` with `{ status: 'success', message: 'User deleted successfully', data: null }`.
- Business Logic: Orchestrates user removal via the delete command.
- Edge Cases: Non-existent id → 404; the response data is `null`.
- Notes: Uses `successResponse` with a `null` data payload.
