# Folder: api

# Path: src/api

# Purpose

The **API** layer is the boundary between the outside world (HTTP) and the application. It is responsible for receiving incoming HTTP requests, validating and shaping the input, mapping that input into CQRS `Command`/`Query` objects, invoking the appropriate application handler, and translating the resulting domain data into HTTP responses. It is the only layer that knows about Express (`Request`/`Response`).

# Responsibilities

- **Routes** (`routes/`): Declare URL paths, HTTP verbs, and which middleware/controller handles each route. Group related resources under a sub-router.
- **Controllers** (`controllers/`): Extract data from the Express `Request` (body, query, params), validate it via the request-level validation (already applied at the route via middleware), build CQRS messages, resolve handlers from the DI container, and send responses using the shared response helpers.
- **Request mapping**: Translate HTTP/transport concerns into application-layer concerns (e.g. `req.body` → `new CreateUserCommand(...)`).
- **Response shaping**: Use `successResponse`, `createdResponse`, and `paginatedResponse` to return a consistent JSON envelope to clients.
- **Swagger wiring**: Route-level JSDoc annotations are scanned by the swagger config to document endpoints.

# Why this folder exists

The API layer isolates all HTTP/framework concerns so that the `application` and `domain` layers never import Express. By keeping routes and controllers thin and free of business logic, the project follows Clean Architecture: the API layer is a *delivery mechanism* — you could port the whole app to a different transport (CLI, gRPC, web socket) without touching the use cases. Because almost every call here is delegated to a handler, a Frontend Developer sees this layer as the map of "what endpoints exist and what they call."

# What files belong here

```
api/
├── controllers/
│   └── user.controller.ts      # One controller per resource, one function per HTTP action
└── routes/
    ├── index.ts                # Root router; mounts sub-routers (e.g. /users)
    └── user.routes.ts          # Verb + path + validate middleware + controller action
```

Note: There is currently a single `user` resource, but this pattern is designed to scale — add `controllers/posts.controller.ts` and `routes/posts.routes.ts` next to them.

# Which layer depends on it

- **Nothing depends on `api`.** It is the outermost application layer. `app.ts` imports the root router from `api/routes`, but no production layer imports `api` internals.

The `api` layer itself depends on:
- `application` (commands, queries, handlers)
- `domain` (indirectly, via the DTOs and value objects used in handlers/DTOs)
- `shared` (middleware, response helpers, `asyncHandler`)
- `infrastructure/di` (to resolve handlers from the container)

# Which layer should NOT depend on it

- `application`, `domain`, and `infrastructure` must **never** import anything from `api`. That would leak HTTP concerns inward and break the dependency rule.
- Nothing should reach into `api` and call a controller function; controllers are transport glue, not use cases.

# Flow

```
Client request  ──►  api/routes/user.routes.ts
                      │  validate(schema, 'body'|'query'|'params')
                      ▼
                     api/controllers/user.controller.ts
                      │  resolve handler from container
                      │  build Command/Query
                      ▼
                     application/handlers/*.ts  (use case)
                      ▼
                     domain/repositories (interface) → infrastructure/repository
                      ▼
```

If validation fails, the `validate` middleware calls `next(new ValidationError(...))` and the request is short-circuited to the shared error handler — the controller never runs.

# Example

For `POST /api/users` with body `{ email, name, role }`:

1. `api/routes/user.routes.ts:10` — `router.post('/', validate(createUserSchema, 'body'), createUser)` validates the body with the zod schema.
2. `api/controllers/user.controller.ts:107` — `createUser` reads `req.body`, calls `createUserHandler()` (resolved from DI), and constructs `new CreateUserCommand(data.email, data.name, data.role)`.
3. The handler runs the use case; on success the controller calls `createdResponse(res, user, 'User created successfully')` → HTTP 201.

# Related Folders

- `src\app.ts` (top-level) — the Express app that mounts `api/routes/index.ts` under `/api`.
- `docs\folders\application.md` — where the controllers' commands/queries/handlers live.
- `docs\folders\shared.md` — `validate`, `asyncHandler`, and the response helpers used here.
