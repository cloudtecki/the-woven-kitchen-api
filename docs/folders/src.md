# Folder: src

# Path: src/

# Purpose

`src/` is the entire backend source tree of the **TWK Admin** API. It is the single place where all application code lives — every layer of the Clean Architecture + CQRS design, from the HTTP entry point down to the MongoDB persistence layer, is contained here. Nothing meaningful lives outside of it except build outputs (`dist/`), configuration, and Docker/CI files.

The tree is deliberately organized into **strictly isolated layers** so that dependencies flow inward only, and so that a Frontend Developer can trace a single HTTP request from route → controller → handler → repository → database without ever wondering where a piece of logic "lives."

# Responsibilities

- Define the **entry points** of the application: `server.ts` (bootstrap) and `app.ts` (Express app assembly).
- Group code into the five Clean Architecture layers: `api`, `application`, `domain`, `infrastructure`, `shared`, plus `config`.
- Enforce the **dependency rule**: outer layers depend on inner layers, never the reverse.
- Provide a single entry point for seeding, HTTP serving, and dependency wiring.
- Own every translation between HTTP concerns (request/response), application concerns (use cases), and domain concerns (business rules).

# Why this folder exists

Clean Architecture requires a clear separation of concerns so that business logic is not coupled to frameworks (Express), databases (Mongoose), or HTTP plumbing. `src/` is the physical embodiment of that rule. Each top-level folder has one job, and the import direction between them is unidirectional. This makes the backend predictable, testable, and easy to reason about — which is exactly what a Frontend Developer needs when they must understand why a response looks the way it does or where a change has to be made.

# What files belong here

The top-level tree looks like this:

```
src/
├── app.ts                  # Express app assembly (middleware, routes, swagger, error handling)
├── server.ts               # Bootstrap: DB connect + HTTP listen + graceful shutdown
├── api/                    # HTTP layer: routes + controllers + request mapping
├── application/            # Use-case layer: commands, queries, handlers, DTOs
├── domain/                 # Business layer: entities, value objects, interfaces, repositories
├── infrastructure/         # Framework layer: Mongo, models, repositories, DI, seeding
├── shared/                 # Cross-cutting: constants, errors, middleware, types, utils
└── config/                 # Environment + swagger configuration
```

The two root entry files (`app.ts`, `server.ts`) are not part of any single layer — they orchestrate all of them.

# Which layer depends on it

**Every layer** depends on being part of this tree, but more importantly the *relation* between the sub-folders follows the dependency rule:

```
api  ──►  application  ──►  domain
          application  ──►  shared
          infrastructure ──► domain, shared
          api/infrastructure ──► shared
```

- `api`, `application`, and `infrastructure` all depend on `domain` (never on each other's internals).
- `shared` is depended on by everyone but depends on nothing except `config`.
- `config` is a leaf — everything may import it, it imports nothing from the app layers.

# Which layer should NOT depend on it

No single folder "should not depend on `src/`" — all application code is inside it. The rule that matters is at the *sub-folder* level:

- `domain` must **not** import from `api`, `application`, or `infrastructure`. It is pure business logic (interfaces + entities only).
- `application` must **not** import from `api` or `infrastructure`. Handlers only know about domain interfaces and shared errors — never Express or Mongoose.
- `api` should only depend on `application`, `domain`, and `shared` — never `infrastructure` directly *for business logic* (the one exception is the DI container import in controllers, used only to resolve handlers).
- `shared` imports nothing from the other app layers (only `config`).

# Flow

A full request flows through these top-level folders in dependency order:

```
HTTP request
   │
   ▼
api/routes ──► validate (shared/middleware)
   │
   ▼
api/controllers ──► resolve handler from infrastructure/di
   │
   ▼
application/handlers ──► application/commands|queries
   │
   ▼
domain/repositories (interface IUserRepository)
   │
   ▼
infrastructure/repositories (UserRepository) ──► infrastructure/database/models (Mongoose)
   │
   ▼
MongoDB
   │
   ▼
response flows back through shared/utils/response → shared/errors → client
```

# Example

The top-level layers connect like this for a `GET /api/users` request:

1. `api/routes/index.ts` mounts `/users` onto the root router; `api/routes/user.routes.ts` wires `GET /` to `getAllUsers` and runs it through `validate(userQuerySchema, 'query')`.
2. `api/controllers/user.controller.ts` grabs `GetAllUsersHandler` from the DI container, builds a `GetAllUsersQuery`, calls `execute`, and hands the result to `paginatedResponse`.
3. `application/handlers/get-all-users.handler.ts` calls `userRepository.findAll(page, limit)`.
4. `infrastructure/repositories/user.repository.ts` calls the Mongoose `UserModel.find(...)` and maps documents to `domain/entities/user.entity.ts` shapes.
5. `shared/utils/response.ts` serializes the result into a consistent `PaginatedResponse` JSON envelope.

# Related Folders

- `docs\folders\api.md` — the HTTP layer that starts the flow.
- `docs\folders\application.md` — the use-case layer in the middle.
- `docs\folders\domain.md` — the innermost business layer.
- `docs\folders\infrastructure.md` — the outer framework layer (Mongo, DI, seeding).
- `docs\folders\shared.md` — the cross-cutting helpers all layers lean on.
- `docs\folders\config.md` — the leaf configuration layer.
