# Folder: api

# Path: src/api/

# Purpose

The **API** layer is the boundary between the outside world (HTTP) and the application. It is responsible for receiving incoming HTTP requests, validating input, invoking the appropriate handler (or returning a simple response), and translating results into HTTP responses. It is the only layer that knows about Express (`Request`/`Response`).

Currently the only working route is a health check. The `controllers/` and `docs/` sub-folders are empty placeholders for future business endpoints.

# Responsibilities

- **Routes** (`routes/`): Declare URL paths, HTTP verbs, and which middleware/handler handles each route.
- **Middlewares** (`middlewares/`): Shared HTTP-layer concerns — error handling, request logging, and Zod validation.
- **Controllers** (`controllers/`): Empty placeholder. Will contain per-resource controller functions that extract request data, build CQRS commands/queries, resolve handlers, and send responses.
- **Docs** (`docs/`): Empty placeholder. Will contain API documentation artifacts.

# Why this folder exists

The API layer isolates all HTTP/framework concerns so that the `application` and `domain` layers never import Express. By keeping routes and controllers thin and free of business logic, the project follows Clean Architecture: the API layer is a *delivery mechanism* — you could port the whole app to a different transport (CLI, gRPC, web socket) without touching the use cases.

# What files belong here

```
api/
├── routes/
│   ├── index.js                # Root router; mounts sub-routers (currently: health.routes)
│   └── health.routes.js        # GET /health → { status: 'OK' }
├── middlewares/
│   ├── index.js                # Barrel re-export of all middlewares
│   ├── error-handler.js        # errorHandler + notFoundHandler
│   ├── request-logger.js       # requestLogger (logs method, url, statusCode, duration, ip, userAgent)
│   └── validate.js             # validate(schemas) — Zod middleware for body/query/params
├── controllers/                # EMPTY — .gitkeep placeholder for future controllers
└── docs/                       # EMPTY — .gitkeep placeholder for future API docs
```

# Which layer depends on it

- **Nothing depends on `api`.** It is the outermost application layer. `app.js` imports the root router from `api/routes`, but no production layer imports `api` internals.

The `api` layer itself depends on:
- `shared` — `asyncHandler`, error classes, response helpers
- `config` — `config.apiPrefix` (to know the mount point)

Future dependencies (when business logic is implemented):
- `application` — commands, queries, handlers
- `domain` — indirectly, via DTOs and value objects

# Which layer should NOT depend on it

- `application`, `domain`, and `infrastructure` must **never** import anything from `api`. That would leak HTTP concerns inward and break the dependency rule.
- Nothing should reach into `api` and call a controller function; controllers are transport glue, not use cases.

# Flow

```
Client request  ──►  api/routes/index.js
                      │  (mounts sub-routers)
                      ▼
                     api/routes/health.routes.js
                      │  asyncHandler wraps the handler
                      ▼
                     res.json({ status: 'OK' })

Future flow (with business logic):
Client request  ──►  api/routes/<resource>.routes.js
                      │  validate(schema)
                      ▼
                     api/controllers/<resource>.controller.js
                      │  builds Command/Query
                      ▼
                     application/handlers/*.js  (use case)
```

If validation fails, the `validate` middleware calls `next(new ValidationError(...))` and the request is short-circuited to the error handler — the route handler never runs.

# Example

For `GET /api/health`:

1. `api/routes/health.routes.js:8` — `router.get('/health', asyncHandler(...))` receives the request.
2. The handler sends `res.status(200).json({ status: 'OK' })`.
3. If the handler threw, `asyncHandler` forwards the rejection to `api/middlewares/error-handler.js`.

For validation (future use):

```js
// Usage in a route file:
router.post('/', validate({ body: createUserSchema }), createUser);
```

The `validate` middleware (`api/middlewares/validate.js`) parses `req.body`, `req.query`, and `req.params` against the provided Zod schemas. On failure it creates a `ValidationError` with field-level details.

# Related Folders

- `src/app.js` (top-level) — the Express app that mounts `api/routes/index.js` under the configured `apiPrefix`.
- `docs/folders/shared.md` — `validate`, `asyncHandler`, and the response helpers used here.
- `docs/folders/application.md` — the future use-case layer that controllers will delegate to.
