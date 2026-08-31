# Folder: domain

# Path: src/domain/

# Purpose

The **domain** layer is the intended innermost, most stable layer of the application. It will contain the core business abstractions — entities, value objects, and repository contracts — with **zero dependency on frameworks, databases, or HTTP**. It will define *what* the business objects are and *what* operations the system supports, but not how those operations are implemented.

**This folder is currently empty scaffolding.** All sub-folders contain only `.gitkeep` files. No entities, value objects, or repository interfaces have been implemented yet (Story 0.2). This document describes the *intended future purpose* of each sub-folder.

# Responsibilities (Future)

- **Entities** (`entities/`): The core data shapes that flow through the app. Will define a `BaseEntity` (id, createdAt, updatedAt) and domain-specific entities (e.g. `User`).
- **Repositories** (`repositories/`): Persistence *contracts* — plain JavaScript interfaces/protocols that define what data operations are available, with no implementation. For example, `IUserRepository` would define `findById`, `findByEmail`, `create`, `update`, `delete`.
- **Value Objects** (`value-objects/`): Small, immutable domain concepts that need their own constrained type. For example, `UserRole` would be an enum-like constant (`ADMIN | MANAGER | STAFF`).

# Why this folder exists (Future)

Clean Architecture places business rules at the center so they remain framework-agnostic and reusable. If the team later swaps Mongoose for another ODM, or PostgreSQL for Mongo, the `domain` layer does not change at all — only `infrastructure` does. For a developer, this folder will be the source of truth for what the system's data actually looks like (the `User` shape) and what the API is really capable of (the repository operations), independent of transport or storage details.

# What files belong here

Currently (Story 0.2):

```
domain/
├── entities/         # .gitkeep — EMPTY placeholder
├── repositories/     # .gitkeep — EMPTY placeholder
└── value-objects/    # .gitkeep — EMPTY placeholder
```

Future structure (example):

```
domain/
├── entities/
│   ├── base.entity.js                       # BaseEntity (id, createdAt, updatedAt)
│   ├── user.entity.js                       # User entity
│   └── index.js
├── repositories/
│   ├── user-repository.interface.js         # IUserRepository contract
│   └── index.js
└── value-objects/
    ├── user-role.js                         # UserRole enum
    └── index.js
```

# Which layer depends on it

**Everything meaningful** will depend on `domain` (inward dependency — the correct direction):

- `application/handlers` (future) — will use entities and call repository interfaces.
- `api/` (future) — will reference entities and value objects indirectly via DTOs and responses.
- `infrastructure/repositories` (future) — will implement the domain repository interfaces.

# Which layer should NOT depend on it

- `domain` must **not** import from `api`, `application`, or `infrastructure`. It has no imports from any app layer — it stays pure.
- `domain` must **not** import any framework library (no Express, no Mongoose, no Zod). The entities and interfaces use plain JavaScript objects and comments describing the shape (since there are no TypeScript interfaces).

# Flow

```
application/handlers (future)    ── builds on ──►   domain/entities
        │
        ▼
domain/repositories/<interface>  ◄── implements ── infrastructure/repositories
        │
        ▼ (contracts on how data is accessed)
infrastructure/database/models (Mongoose) — the actual implementation
```

The `domain` defines the contract; the `infrastructure` layer fulfills it.

# Example

Future example — `domain/repositories/user-repository.interface.js` would declare the storage contract the whole app is written against:

```js
/**
 * @typedef {Object} IUserRepository
 * @property {(id: string) => Promise<User|null>} findById
 * @property {(email: string) => Promise<User|null>} findByEmail
 * @property {(page?: number, limit?: number) => Promise<{data: User[], total: number}>} findAll
 * @property {(data: CreateUserData) => Promise<User>} create
 * @property {(id: string, data: UpdateUserData) => Promise<User|null>} update
 * @property {(id: string) => Promise<boolean>} delete
 */
```

`infrastructure/repositories/user.repository.js` would provide the Mongoose-backed implementation. Handlers will only ever talk to the interface — they never see Mongo.

# Related Folders

- `docs/folders/application.md` — the use cases that will consume these entities/interfaces.
- `docs/folders/infrastructure.md` — the repository implementations that will fulfill these contracts.
- `docs/folders/shared.md` — value objects like `UserRole` may be referenced by shared utilities.
