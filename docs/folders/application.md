# Folder: application

# Path: src/application/

# Purpose

The **application** layer is the intended use-case / orchestration layer of the CQRS design. It will contain the application's business workflows without any framework or database knowledge — defining the intent (commands/queries), the input/output contracts (DTOs), and the handlers that execute each use case by talking to domain interfaces.

**This folder is currently empty scaffolding.** All sub-folders contain only `.gitkeep` files. No commands, queries, handlers, DTOs, or services have been implemented yet (Story 0.2). This document describes the *intended future purpose* of each sub-folder.

# Responsibilities (Future)

- **Commands** (`commands/`): Intent-to-change messages. Immutable plain objects describing an action (e.g. "create a user"). Naming convention: imperative verb (`CreateUserCommand`).
- **Queries** (`queries/`): Intent-to-read messages. Read-only objects (e.g. "get user by id"). Naming convention: `Get...Query` / `GetAll...Query`.
- **Handlers** (`handlers/`): Execute a single use case. Each handler receives one Command/Query, coordinates with the relevant domain repository interface, enforces use-case-specific business rules, and returns a result. One handler per command/query.
- **DTOs** (`dto/`): Data Transfer Objects + Zod validation schemas shared between the API layer (for request validation) and the handlers (for typing). Define the shape of data crossing the API boundary.
- **Services** (`services/`): Shared application-level services that don't fit the command/query pattern (e.g. file upload orchestration, notification dispatch).

# Why this folder exists (Future)

Commands, queries, handlers, and DTOs give CQRS its separation between **reads** (queries) and **writes** (commands). By keeping the use cases here, business logic is decoupled from Express and Mongoose, making it unit-testable and swappable. The handlers will depend only on `domain` repository *interfaces* (not on Mongo), so a developer can read the full intent of an operation without wading through database queries.

Splitting commands, queries, handlers, DTOs, and services into sub-folders keeps each file small and single-purpose.

# What files belong here

Currently (Story 0.2):

```
application/
├── commands/       # .gitkeep — EMPTY placeholder
├── queries/        # .gitkeep — EMPTY placeholder
├── handlers/       # .gitkeep — EMPTY placeholder
├── dto/            # .gitkeep — EMPTY placeholder
└── services/       # .gitkeep — EMPTY placeholder
```

Future structure (example):

```
application/
├── commands/
│   ├── create-user.command.js
│   └── index.js
├── queries/
│   ├── get-user-by-id.query.js
│   ├── get-all-users.query.js
│   └── index.js
├── handlers/
│   ├── create-user.handler.js
│   ├── get-user-by-id.handler.js
│   ├── get-all-users.handler.js
│   └── index.js
├── dto/
│   ├── user.dto.js                 # Zod schemas + inferred input types
│   └── index.js
└── services/
    └── index.js
```

# Which layer depends on it

- `api/controllers` (future) will depend on it: controllers will build Commands/Queries and call handlers.

The `application` layer itself will depend on:
- `domain` (repository interfaces, entities, value objects)
- `shared` (errors)

# Which layer should NOT depend on it

- `domain` must **not** depend on `application` (domain is more fundamental — use cases consume it, never the reverse).
- `infrastructure/repositories` must not import handlers/commands — repositories only implement the `domain` interfaces.
- `application` must **not** import from `api` or from `infrastructure` (no Express, no Mongoose). Its handlers know nothing about HTTP or the database; they receive everything via domain interfaces.

# Flow

```
api/controller (future)
   │  builds a Command/Query from the request
   ▼
application/handlers/<X>.handler.js (future)
   │  (receives domain repository interface)
   │  runs business rules, then calls the interface method
   ▼
domain/repositories/<entity>-repository.interface.js (future)
   ▼
(implemented by) infrastructure/repositories/<entity>.repository.js (future)
```

For writes, the command flows through a handler; for reads, the query flows through a handler. Both end at the domain repository interface.

# Example

Future example — `application/handlers/create-user.handler.js`:

```js
class CreateUserHandler {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(command) {
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }
    return this.userRepository.create({
      email: command.email,
      name: command.name,
      role: command.role || 'STAFF',
      isActive: true,
    });
  }
}
```

The corresponding `CreateUserCommand` (`application/commands/create-user.command.js`) would be a plain frozen object holding `email`, `name`, `role`.

# Related Folders

- `docs/folders/domain.md` — the repository interfaces, entities, and value objects handlers will use.
- `docs/folders/api.md` — the controllers that will build commands/queries and invoke handlers.
- `docs/folders/shared.md` — the error classes handlers will import.
