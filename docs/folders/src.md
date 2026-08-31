# Folder: src

# Path: src/

# Purpose

`src/` is the entire backend source tree of the **TWK Admin** API. It is the single place where all application code lives — every layer of the Clean Architecture design (prepared for future CQRS adoption) is contained here. Nothing meaningful lives outside of it except configuration, Docker/CI files, and documentation.

The tree is organized into **strictly isolated layers** so that dependencies flow inward, and so that a developer can trace a single HTTP request from route → controller → handler → repository → database without ever wondering where a piece of logic "lives."

The project is written in **plain JavaScript** (CommonJS modules, `require`/`module.exports`) with Express and Mongoose. There is no TypeScript, no build step, and no dependency injection container — the app runs directly via `node src/server.js`.

# Responsibilities

- Define the **entry points** of the application: `server.js` (bootstrap) and `app.js` (Express app assembly).
- Group code into five Clean Architecture layers: `api`, `application`, `domain`, `infrastructure`, `shared`, plus `config`.
- Enforce the **dependency rule**: outer layers depend on inner layers, never the reverse.
- Provide a single entry point for HTTP serving and graceful shutdown.
- Own every translation between HTTP concerns (request/response), application concerns (use cases), and domain concerns (business rules).

> **Note:** The `application/`, `domain/`, `infrastructure/database/models/`, and `infrastructure/repositories/` folders are currently **empty scaffolding** (`.gitkeep` only). They exist as placeholders for future CQRS/business stories (Story 0.2+). No business entities, models, or handlers have been implemented yet.

# Why this folder exists

Clean Architecture requires a clear separation of concerns so that business logic is not coupled to frameworks (Express), databases (Mongoose), or HTTP plumbing. `src/` is the physical embodiment of that rule. Each top-level folder has one job, and the import direction between them is unidirectional. This makes the backend predictable, testable, and easy to reason about.

# What files belong here

The top-level tree looks like this:

```
src/
├── app.js                          # Express app: helmet, cors, compression, json, urlencoded,
│                                   #   requestLogger (dev), routes under /api, swagger at /api-docs,
│                                   #   notFoundHandler, errorHandler
├── server.js                       # Bootstrap: connectDB() then app.listen(port);
│                                   #   SIGINT/SIGTERM graceful shutdown
├── api/
│   ├── routes/
│   │   ├── index.js                # Router; mounts health.routes
│   │   └── health.routes.js        # GET /health -> { status: 'OK' }
│   ├── middlewares/
│   │   ├── index.js                # Barrel re-export of all middlewares
│   │   ├── error-handler.js        # errorHandler, notFoundHandler
│   │   ├── request-logger.js       # requestLogger (structured logging per request)
│   │   └── validate.js             # validate(schemas) — Zod middleware
│   ├── controllers/                # EMPTY — placeholder for future controllers (.gitkeep)
│   └── docs/                       # EMPTY — placeholder for future API docs (.gitkeep)
├── application/                    # EMPTY — placeholder for future CQRS scaffolding
│   ├── commands/                   #   (.gitkeep)
│   ├── queries/                    #   (.gitkeep)
│   ├── handlers/                   #   (.gitkeep)
│   ├── dto/                        #   (.gitkeep)
│   └── services/                   #   (.gitkeep)
├── config/
│   ├── index.js                    # Zod env validation -> config object
│   └── swagger.js                  # swaggerSpec (OpenAPI 3.0) with /api/health
├── domain/                         # EMPTY — placeholder for future business entities
│   ├── entities/                   #   (.gitkeep)
│   ├── repositories/               #   (.gitkeep)
│   └── value-objects/              #   (.gitkeep)
├── infrastructure/
│   ├── database/
│   │   ├── mongoose/
│   │   │   └── connection.js       # connectDB()/disconnectDB() via mongoose.connect
│   │   └── models/                 # EMPTY — placeholder for future Mongoose models (.gitkeep)
│   ├── repositories/               # EMPTY — placeholder for future repository impls (.gitkeep)
│   └── config/                     # EMPTY — placeholder (.gitkeep)
└── shared/
    ├── constants/
    │   └── error-codes.js          # ERROR_CODES frozen object
    ├── errors/
    │   ├── app-error.js            # AppError base class
    │   ├── custom-errors.js        # NotFoundError, ValidationError, ConflictError, InternalError
    │   └── index.js                # Barrel re-export
    └── utils/
        ├── logger.js               # Winston logger (dev/prod formats)
        ├── response.js             # successResponse, createdResponse, noContentResponse,
        │                           #   errorResponse, paginatedResponse
        ├── async-handler.js        # asyncHandler (wraps async route handlers)
        └── index.js                # Barrel re-export
```

The two root entry files (`app.js`, `server.js`) are not part of any single layer — they orchestrate all of them.

# Which layer depends on it

**Every layer** depends on being part of this tree, but the *relation* between the sub-folders follows the dependency rule:

```
api  ──►  application  ──►  domain       (future)
          application  ──►  shared       (future)
          infrastructure ──► domain      (future)
          infrastructure ──► shared
          api/infrastructure ──► shared
```

Currently, only `api`, `infrastructure` (connection only), `shared`, and `config` contain real code. The dependency flow today is:

```
app.js ──► api/routes, api/middlewares, config
server.js ──► app.js, config, infrastructure/database/mongoose/connection, shared/utils/logger
```

- `shared` is depended on by everyone but depends on nothing except `config`.
- `config` is a leaf — everything may import it, it imports nothing from the app layers.

# Which layer should NOT depend on it

No single folder "should not depend on `src/`" — all application code is inside it. The rule that matters is at the *sub-folder* level:

- `domain` must **not** import from `api`, `application`, or `infrastructure`. It is pure business logic (entities + interfaces only).
- `application` must **not** import from `api` or `infrastructure`. Handlers only know about domain interfaces and shared errors — never Express or Mongoose.
- `api` should only depend on `application`, `domain`, and `shared` — never `infrastructure` directly for business logic.
- `shared` imports nothing from the other app layers (only `config`).

# Flow

A full request flows through these top-level folders in dependency order:

```
HTTP request
   │
   ▼
api/routes ──► validate (api/middlewares)
   │
   ▼
api/controllers  [EMPTY — future CQRS handlers will go here]
   │
   ▼
application/handlers  [EMPTY — future use cases]
   │
   ▼
domain/repositories  [EMPTY — future interfaces]
   │
   ▼
infrastructure/repositories  [EMPTY] ──► infrastructure/database/models  [EMPTY]
   │
   ▼
MongoDB  (via infrastructure/database/mongoose/connection.js)
   │
   ▼
response flows back through shared/utils/response → shared/errors → client
```

# Example

The simplest currently-working request flow for `GET /api/health`:

1. `src/app.js` mounts `api/routes/index.js` under `/api`.
2. `api/routes/index.js` requires `health.routes.js`.
3. `api/routes/health.routes.js` handles `GET /health` via `asyncHandler`, responds with `{ "status": "OK" }`.
4. If any async handler rejects, `api/middlewares/error-handler.js` catches it and returns a structured error JSON.

# Related Folders

- `docs/folders/api.md` — the HTTP layer that starts the flow.
- `docs/folders/application.md` — the future use-case layer (empty scaffolding).
- `docs/folders/domain.md` — the future business layer (empty scaffolding).
- `docs/folders/infrastructure.md` — the framework layer (Mongo connection + empty scaffolding).
- `docs/folders/shared.md` — the cross-cutting helpers all layers lean on.
- `docs/folders/config.md` — the leaf configuration layer.
