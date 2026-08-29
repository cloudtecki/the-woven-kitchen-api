# Folder: application

# Path: src/application

# Purpose

The **application** layer is the use-case / orchestration layer of the CQRS design. It contains the application's business workflows without any framework or database knowledge. It defines the intent (commands/queries), the input/output contracts (DTOs), and the handlers that execute each use case by talking to domain interfaces. This is where "what should happen" lives; *how* it persists happens in `infrastructure`.

# Responsibilities

- **Commands** (`commands/`): Intent-to-change messages. Immutable plain objects describing an action (e.g. "create a user"). Naming: imperative verb (`CreateUserCommand`).
- **Queries** (`queries/`): Intent-to-read messages. Plain read-only objects (e.g. "get user by id"). Naming: `Get...Query` / `GetAll...Query`.
- **Handlers** (`handlers/`): Execute a single use case. Each handler receives one Command/Query, coordinates with the relevant domain repository interface (injected), enforces business rules unique to the use case (e.g. uniqueness check), and returns a domain entity. One handler per command/query.
- **DTOs** (`dto/`): Data Transfer Objects + zod validation schemas shared between the API layer (for request validation) and the handlers (for typing). These define the shape of data crossing the API boundary.

# Why this folder exists

Commands, queries, handlers, and DTOs give CQRS its separation between **reads** (queries) and **writes** (commands). By keeping the use cases here, business logic is decoupled from Express and Mongoose, making it unit-testable and swappable. The handlers depend only on the `domain` repository *interfaces* (not on Mongo), so a Frontend Developer can read the full intent of an operation without wading through database queries. Splitting commands, queries, handlers, and DTOs into subfolders keeps each file tiny and single-purpose.

# What files belong here

```
application/
├── commands/
│   ├── create-user.command.ts
│   ├── update-user.command.ts
│   ├── delete-user.command.ts
│   └── index.ts                      # barrel export
├── queries/
│   ├── get-user-by-id.query.ts
│   ├── get-all-users.query.ts
│   └── index.ts
├── handlers/
│   ├── create-user.handler.ts
│   ├── update-user.handler.ts
│   ├── delete-user.handler.ts
│   ├── get-user-by-id.handler.ts
│   ├── get-all-users.handler.ts
│   └── index.ts
└── dto/
    ├── user.dto.ts                   # zod schemas + inferred input types
    └── index.ts
```

# Which layer depends on it

- `api/controllers` depend on it: controllers build Commands/Queries and call handlers.
- `infrastructure/di/container.ts` depends on it: it binds each `*Handler` into the DI container.
- `shared/constants/tokens.ts` references it indirectly via the handler type tokens.

The `application` layer itself depends on:
- `domain` (repository interfaces, entities, value objects)
- `shared` (errors, and `TYPES` via the handlers' `@inject` decorators)

# Which layer should NOT depend on it

- `domain` must **not** depend on `application` (domain is more fundamental — use cases consume it, never the reverse).
- `infrastructure/repositories` must not import handlers/commands — repositories only implement the `domain` interfaces.
- `application` must **not** import from `api` or from `infrastructure` (no Express, no Mongoose). Its handlers know nothing about HTTP or the database; they receive everything via injected domain interfaces.

# Flow

```
api/controller
   │  builds a Command/Query from the request
   ▼
application/handlers/<X>.handler.ts
   │  (injected with domain repository interface)
   │  runs business rules, then calls the interface method
   ▼
domain/repositories/user-repository.interface.ts
   ▼
(implemented by) infrastructure/repositories/user.repository.ts
```

For writes, the command flows through a handler; for reads, the query flows through a handler. Both end at the domain repository interface.

# Example

`application/handlers/create-user.handler.ts`:

1. Handlers are `@injectable()` and receive `IUserRepository` via constructor injection (`@inject(TYPES.UserRepository)`).
2. `execute(command)` first calls `userRepository.findByEmail(command.email)`; if a user exists it throws `ConflictError('User with this email already exists')`.
3. Otherwise it returns `userRepository.create({ email, name, role: role || UserRole.STAFF, isActive: true })` — producing a `domain/entities/user.entity.ts` `User`.

The corresponding `CreateUserCommand` (`application/commands/create-user.command.ts`) is a plain immutable class holding `public readonly email/name/role`.

# Related Folders

- `docs\folders\domain.md` — the repository interfaces, entities, and value objects handlers use.
- `docs\folders\api.md` — the controllers that build commands/queries and invoke handlers.
- `docs\folders\infrastructure.md` — where handlers are bound into the DI container (`infrastructure/di`).
- `docs\folders\shared.md` — the `TYPES` tokens and error classes handlers import.
