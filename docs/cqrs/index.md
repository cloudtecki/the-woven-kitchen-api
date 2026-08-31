# CQRS in backend-twk-admin

> **Current status (Story 0.2):** No CQRS implementation exists yet. The application and domain layer directories are scaffolded with `.gitkeep` placeholders only. This document describes the **intended future design**, not current working code.

## What is CQRS?

CQRS (Command Query Responsibility Segregation) separates the two kinds of operations a system performs:

- **Commands** — operations that **change** state (create, update, delete). They are imperative verbs, e.g. "create an order".
- **Queries** — operations that **read** state without changing it (get one, list many). They are nouns, e.g. "the order by id".

Each operation is represented as a **plain data object** (a DTO / value object) that holds only the input. The actual **business logic** lives in a matching **Handler**. Handlers bridge the HTTP layer (Express routes) and the persistence layer (Mongoose models).

## Current scaffolding

The following directories exist in the source tree but contain **only `.gitkeep` files** — no implementation code:

| Directory | Purpose (future) |
| --- | --- |
| `src/application/commands/` | Write-operation DTOs (e.g. a future `CreateOrderCommand`) |
| `src/application/queries/` | Read-operation DTOs (e.g. a future `GetOrderByIdQuery`) |
| `src/application/handlers/` | Business logic for each command/query |
| `src/application/dto/` | Shared DTO definitions |
| `src/application/services/` | Application-layer services |
| `src/domain/entities/` | Domain entity classes |
| `src/domain/repositories/` | Repository interfaces (ports) |
| `src/domain/value-objects/` | Value objects |

There is **no** `cqrs.interface.ts` or `cqrs.interface.js` file. There are **no** User commands, queries, handlers, repositories, controllers, or DI container. There is no Inversify, no `reflect-metadata`, no TypeScript.

## Intended future design

The project will adopt CQRS in plain JavaScript (CommonJS). The planned pattern:

```
┌───────────────────────────────────┐
│   Express Route Handlers          │
│   src/api/routes/                 │
└───────────────┬───────────────────┘
                │
     ┌──────────┴──────────┐
     │                     │
 (WRITE)                (READ)
 Commands DTOs          Queries DTOs
     │                     │
     ▼                     ▼
 Command Handlers       Query Handlers
 (business logic)      (business logic, read-only)
     │                     │
     └──────────┬──────────┘
                ▼
         Repository (port)
                │
                ▼
         Repository (Mongoose adapter)
                │
                ▼
            MongoDB
```

### Commands (writes)

A command is a plain object (DTO) holding input data for a state-changing operation. Example (future, illustrative only):

```js
class CreateOrderCommand {
  constructor({ productId, quantity, customerId }) {
    this.productId = productId;
    this.quantity = quantity;
    this.customerId = customerId;
  }
}
```

### Queries (reads)

A query is a plain object (DTO) holding input data for a read-only operation. Example (future, illustrative only):

```js
class GetOrderByIdQuery {
  constructor(orderId) {
    this.orderId = orderId;
  }
}
```

### Handlers

A handler receives a command or query DTO and executes the business logic. It calls a repository for persistence. Example (future, illustrative only):

```js
class CreateOrderHandler {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(command) {
    // business logic here
    return this.orderRepository.create(command);
  }
}
```

### Mapping table (planned pattern)

When commands/queries are introduced in future stories, each will follow this mapping pattern:

| Command / Query | Handler | Repository Method | Mongoose Operation |
| --- | --- | --- | --- |
| `CreateXCommand` | `CreateXHandler` | `create` | `Model.create(...)` |
| `UpdateXCommand` | `UpdateXHandler` | `update` | `findByIdAndUpdate(...)` |
| `DeleteXCommand` | `DeleteXHandler` | `delete` | `findByIdAndDelete(...)` |
| `GetXByIdQuery` | `GetXByIdHandler` | `findById` | `findById(...).lean()` |
| `GetAllXQuery` | `GetAllXHandler` | `findAll` | `find(...).sort().skip().limit()` |

### HTTP → CQRS mapping (planned pattern)

| REST Endpoint | Method | Command / Query | Handler |
| --- | --- | --- | --- |
| `/api/<resource>` | GET | `GetAllXQuery` | `GetAllXHandler` |
| `/api/<resource>/:id` | GET | `GetXByIdQuery` | `GetXByIdHandler` |
| `/api/<resource>` | POST | `CreateXCommand` | `CreateXHandler` |
| `/api/<resource>/:id` | PUT | `UpdateXCommand` | `UpdateXHandler` |
| `/api/<resource>/:id` | DELETE | `DeleteXCommand` | `DeleteXHandler` |

## Directory reference

| Path | Content |
| --- | --- |
| `src/application/commands/` | `.gitkeep` (scaffolding) |
| `src/application/queries/` | `.gitkeep` (scaffolding) |
| `src/application/handlers/` | `.gitkeep` (scaffolding) |
| `src/application/dto/` | `.gitkeep` (scaffolding) |
| `src/application/services/` | `.gitkeep` (scaffolding) |
| `src/domain/entities/` | `.gitkeep` (scaffolding) |
| `src/domain/repositories/` | `.gitkeep` (scaffolding) |
| `src/domain/value-objects/` | `.gitkeep` (scaffolding) |
| `src/infrastructure/repositories/` | `.gitkeep` (scaffolding) |
| `src/api/controllers/` | `.gitkeep` (scaffolding) |
