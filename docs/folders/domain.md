# Folder: domain

# Path: src/domain

# Purpose

The **domain** layer is the innermost, most stable layer of the application. It contains the core business abstractions — entities, value objects, interfaces, and repository contracts — with **zero dependency on frameworks, databases, or HTTP**. It defines *what* a "User" is and *what* operations the system supports, but not how those operations are implemented. Everything else in the project depends on it; it depends on nothing.

# Responsibilities

- **Entities** (`entities/`): The core data shapes that flow through the app. Define `BaseEntity` (id, createdAt, updatedAt) and `User` (email, name, role, isActive).
- **Value Objects** (`value-objects/`): Small, immutable domain concepts that need their own constrained type. `UserRole` is an enum (`ADMIN | MANAGER | STAFF`).
- **Interfaces** (`interfaces/`): Generic contracts for the app's architectural building blocks (CQRS `Command` and `Query` interfaces).
- **Repositories** (`repositories/`): Persistence *contracts* — interfaces like `IUserRepository` that define what data operations are available, with no implementation.

# Why this folder exists

Clean Architecture places business rules at the center so they remain framework-agnostic and reusable. If the team later swaps Mongoose for another ODM, or PostgreSQL for Mongo, the `domain` layer does not change at all — only `infrastructure` does. For a Frontend Developer, this folder is the source of truth for what the system's data actually looks like (the `User` shape) and what the API is really capable of (the repository operations), independent of transport or storage details.

# What files belong here

```
domain/
├── entities/
│   ├── base.entity.ts                       # BaseEntity interface (id, createdAt, updatedAt)
│   ├── user.entity.ts                       # User interface extends BaseEntity
│   └── index.ts
├── interfaces/
│   ├── cqrs.interface.ts                    # Command<T, TResult> / Query<TInput, TOutput>
│   └── index.ts
├── repositories/
│   ├── user-repository.interface.ts         # IUserRepository + data contracts
│   └── index.ts
└── value-objects/
    ├── user-role.ts                         # UserRole enum
    └── index.ts
```

# Which layer depends on it

**Everything meaningful** depends on `domain` (inward dependency — the correct direction):

- `application/handlers` — inject `IUserRepository`, use `User` and `UserRole`.
- `api/` — uses `UserRole` (via DTOs/swagger) and the `User` shape in responses.
- `infrastructure/repositories` — implements `IUserRepository` and maps between Mongo docs and `User` entities.
- `infrastructure/di` — binds `IUserRepository` to its concrete implementation.
- `shared` — `auth.middleware` uses `UserRole`.

# Which layer should NOT depend on it

This folder is correct only if nothing it contains is violated by reverse imports. The rules:

- `domain` must **not** import from `api`, `application`, or `infrastructure` — it has no imports from any app layer, so it stays pure.
- `domain` must **not** import any framework library (no Express, no Mongoose, no Zod). Note that `domain/repositories` uses plain TypeScript interfaces and `domain/entities` uses plain interfaces/enums — no schema or model imports.

# Flow

```
application/handlers/...    ── builds on ──►   domain/entities/User, UserRole
        │                                            │
        ▼                                            ▼
domain/repositories/IUserRepository  ◄── implements ── infrastructure/repositories/UserRepository
        │
        ▼ (contracts on how data is accessed)
infrastructure/database/models (Mongoose) — the actual implementation
```

The `domain` defines the contract; the `infrastructure` layer fulfills it.

# Example

`domain/repositories/user-repository.interface.ts` declares the storage contract the whole app is written against:

```ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(page?: number, limit?: number): Promise<FindAllResult>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
```

`infrastructure/repositories/user.repository.ts` provides the Mongoose-backed implementation of that exact interface. Handlers only ever talk to the interface — they never see Mongo.

# Related Folders

- `docs\folders\application.md` — the use cases that consume these entities/interfaces.
- `docs\folders\infrastructure.md` — the `UserRepository` that implements `IUserRepository`.
- `docs\folders\shared.md` — commonly shares `UserRole` (e.g. in `auth.middleware`).
