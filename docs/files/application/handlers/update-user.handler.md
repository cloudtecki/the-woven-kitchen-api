# File Name

`update-user.handler.ts`

# File Path

`src/application/handlers/update-user.handler.ts`

# Purpose

Implements the write-side use case "update a user" in the CQRS application layer. `UpdateUserHandler` is an Inversify `@injectable` handler that consumes an `UpdateUserCommand`, applies the optional patch fields (`name`, `role`, `isActive`) via `IUserRepository.update`, and raises a `NotFoundError` (HTTP 404) when no matching user exists.

# Responsibilities

- Register with Inversify as injectable and constructor-inject `IUserRepository` via `TYPES.UserRepository`.
- Execute partial-update semantics: only fields present on the command are forwarded to the repository.
- Map the repository's `null` result (no record with that `id`) to a 404 `NotFoundError('User')`.
- Return the updated domain `User` entity on success.
- Keep persistence concerns delegated to the repository port (no Mongo/Express awareness).

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `injectable` (from `inversify`) | decorator | Marks the class as injectable by the DI container. |
| `inject` (from `inversify`) | decorator/function | Injects `TYPES.UserRepository`'s implemented binding. |
| `UpdateUserCommand` (from `../commands/update-user.command`) | class | The command value object consumed by `execute`. |
| `IUserRepository` (from `../../domain/repositories/user-repository.interface`) | interface | The repository port; `update(id, data)` returns `User \| null`. |
| `User` (from `../../domain/entities/user.entity`) | interface | The domain entity type returned by `execute`. |
| `TYPES` (from `../../shared/constants/tokens`) | const object | Inversify tokens; `TYPES.UserRepository` links the repository interface to its implementation. |
| `NotFoundError` (from `../../shared/errors`) | class | Operational error (HTTP 404, code `NOT_FOUND`) thrown when the user does not exist. |

# Exports

- `UpdateUserHandler` (class)

# Internal Functions

See the `Function: execute` section below.

# Execution Flow

1. The DI container resolves `UpdateUserHandler` with the bound `IUserRepository`.
2. A controller (or mediator) calls `await handler.execute(command)`.
3. `execute` calls `this.userRepository.update(command.id, { name, role, isActive })` — passing the possibly-`undefined` optional fields through.
4. If the repository returns `null` → throw `new NotFoundError('User')`.
5. Otherwise return the updated `User`.

# Related Files

- `src/application/commands/update-user.command.ts` — the input contract (`UpdateUserCommand`)
- `src/application/handlers/create-user.handler.ts` — sibling write handler
- `src/application/handlers/delete-user.handler.ts` — sibling write handler
- `src/application/handlers/index.ts` — barrel exporting this handler
- `src/domain/repositories/user-repository.interface.ts` — the port (`update`, `UpdateUserData`)
- `src/domain/entities/user.entity.ts` — the `User` return type
- `src/shared/constants/tokens.ts` — `TYPES.UserRepository` token
- `src/shared/errors/index.ts` — `NotFoundError` definition
- `src/application/dto/user.dto.ts` — `updateUserSchema` validates the patch body first

# Example Usage

```ts
import { Container } from 'inversify';
import { UpdateUserHandler, UpdateUserCommand } from '../application';

const handler = container.get<UpdateUserHandler>(TYPES.UpdateUserHandler);

const command = new UpdateUserCommand('663c...id', undefined, UserRole.ADMIN, false);
const user = await handler.execute(command);   // throws NotFoundError if id unknown
```

# Best Practices

- Let the repository decide semantics of `undefined` fields (treat as "don't change"); hand the command's fields through verbatim rather than building a half-populated object manually.
- Throw domain/operational `NotFoundError` so the HTTP layer maps it to 404 automatically.
- Don't validate inside the handler — `updateUserSchema` already enforced shape at the edge.
- Prefer explicit optionals in `execute`'s patch so partial updates stay partial.

# Common Mistakes

- Treating `undefined` as "clear the field" inside the handler; with this design, to clear you'd need explicit nullable support elsewhere.
- Forgetting to null-check the repository result before returning, which would let a 404 fall through as `null` to the controller.
- Re-validating command data or importing zod into handlers.
- Throwing plain `Error('User not found')` which the middleware can't map to 404.

# Notes For Frontend Developers

- Updating a user (typically `PATCH /users/:id`) with only changed fields — server leaves other fields untouched.
- Success → 200 with the updated user object.
- Unknown `id` → **404 Not Found** with message like `User not found`; handle by refreshing the list or showing a "user no longer exists" state.
- `isActive: false` genuinely disables the user — pass it exactly, it is a real value the handler forwards (not dropped as falsy).

## Function: execute

- Location: `src/application/handlers/update-user.handler.ts:12`
- Purpose: Applies the partial update body to an existing user and maps the miss-case to a 404.
- Parameters:

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `command` | `UpdateUserCommand` | Yes | Immutable command carrying `id` plus optional `name`, `role`, `isActive` patch fields. |

- Return Type: `Promise<User>` — the updated domain user entity.
- Throws:
  - `NotFoundError` — when `userRepository.update` resolves to `null`. Message: `'User not found'` (constructor prefixes the resource name), HTTP 404.
- Called By:
  - API controller / mediator for the user update route.
  - CQRS command dispatcher.
  - Tests (mocked repository).
- Calls:
  - `this.userRepository.update(command.id, { name: command.name, role: command.role, isActive: command.isActive })`
- Execution Flow:
  1. Call `await this.userRepository.update(command.id, { name, role, isActive })`.
  2. If result is `null` → `throw new NotFoundError('User')`.
  3. Return the updated `User`.
- Example Input:
  ```ts
  new UpdateUserCommand('663c...id', 'Robert', undefined, false)
  ```
- Example Output:
  ```ts
  User {
    id: '663c...id',
    email: 'bob@corp.com',
    name: 'Robert',
    role: 'MANAGER',
    isActive: false,
    createdAt: 2025-01-01T00:00:00.000Z,
    updatedAt: 2026-08-27T11:30:00.000Z,
  }
  ```
- Business Logic:
  - Partial update: forwards only the provided fields; `undefined` options are passed through and interpreted by the repository as "unchanged".
  - Aware that an omitted user must not mutate: `null` → 404.
- Edge Cases:
  - `command.isActive === false`: boolean `false` must be forwarded (truthiness checks would wrongly drop it).
  - `command.name`/`role` omitted → repository receives `undefined`; no written change for those fields.
  - Unknown/malformed `id` → repository resolves `null` → `NotFoundError`.
- Notes: The email field is not part of this command/update at all — email changes are intentionally unsupported in the current API surface.