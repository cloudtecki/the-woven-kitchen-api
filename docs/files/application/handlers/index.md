# File Name

`index.ts` (handlers barrel)

# File Path

`src/application/handlers/index.ts`

# Purpose

Barrel module that aggregates and re-exports all user command/query handlers from the application-layer handlers folder. It is consumed by the application root barrel (`src/application/index.ts`) and provides a single entry point for the CQRS application-layer handlers. These handler classes are the ones registered as bindings in the Inversify container via the `TYPES.*Handler` tokens.

# Responsibilities

- Re-export the five handlers: `CreateUserHandler`, `UpdateUserHandler`, `DeleteUserHandler`, `GetUserByIdHandler`, `GetAllUsersHandler`.
- Give the DI composition root a stable import path for registering handler bindings.
- Keep consumers decoupled from concrete handler file paths.
- Represent the full catalogue of application-layer use cases (3 writes, 2 reads).

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `./create-user.handler` | relative module | Source of `CreateUserHandler`. |
| `./update-user.handler` | relative module | Source of `UpdateUserHandler`. |
| `./delete-user.handler` | relative module | Source of `DeleteUserHandler`. |
| `./get-user-by-id.handler` | relative module | Source of `GetUserByIdHandler`. |
| `./get-all-users.handler` | relative module | Source of `GetAllUsersHandler`. |

The barrel imports no external libraries.

# Exports

- `CreateUserHandler` — from `./create-user.handler`
- `UpdateUserHandler` — from `./update-user.handler`
- `DeleteUserHandler` — from `./delete-user.handler`
- `GetUserByIdHandler` — from `./get-user-by-id.handler`
- `GetAllUsersHandler` — from `./get-all-users.handler`

# Internal Functions

None. The file contains only `export { ... } from ...` statements.

# Execution Flow

1. Module is imported (directly or via `src/application/index.ts`).
2. TypeScript resolves each `export { X } from './file'` against the corresponding handler module.
3. The five handler classes become available on the barrel; the composition root can then bind them to `TYPES.*Handler` tokens.
4. No instantiation happens at import time — instantiation is the container's job via constructor injection.

# Related Files

- `src/application/handlers/create-user.handler.ts` — create handler
- `src/application/handlers/update-user.handler.ts` — update handler
- `src/application/handlers/delete-user.handler.ts` — delete handler
- `src/application/handlers/get-user-by-id.handler.ts` — get-one query handler
- `src/application/handlers/get-all-users.handler.ts` — list query handler
- `src/application/index.ts` — re-exports this barrel
- `src/application/commands/*.ts`, `src/application/queries/*.ts` — the messages these handlers execute
- `src/shared/constants/tokens.ts` — `TYPES.*Handler` tokens used for binding

# Example Usage

```ts
// Composition root (DI wiring)
import { Container } from 'inversify';
import { CreateUserHandler, GetAllUsersHandler } from '../application';
import { TYPES } from '../shared/constants/tokens';

container.bind<CreateUserHandler>(TYPES.CreateUserHandler).to(CreateUserHandler);
container.bind<GetAllUsersHandler>(TYPES.GetAllUsersHandler).to(GetAllUsersHandler);
```

# Best Practices

- Bind handlers in the container using the token names from `TYPES` and resolve them via the barrel to avoid import drift.
- Register every new handler in this barrel to keep the root export complete.
- Keep exports unidirectional; handlers must not import back from this barrel.
- Keep the barrel free of logic.

# Common Mistakes

- Forgetting to export a new handler from the barrel, then trying to bind an unresolved symbol in the container.
- Importing a handler from a concrete file in one place and from the barrel elsewhere, duplicating the module graph.
- Creating circular imports by having handler files import from `src/application` (the root barrel) rather than their direct deps.

# Notes For Frontend Developers

- Server-side only; you never import this file.
- Practically, the five handlers map to the five user REST operations: create, update, delete, get-by-id, get-all — with the error characteristics already documented in each handler's markdown (404 on missing resource for update/delete/get-one; 409 on duplicate create; pagination envelope on list).