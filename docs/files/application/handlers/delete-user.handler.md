# File Name

`delete-user.handler.ts`

# File Path

`src/application/handlers/delete-user.handler.ts`

# Purpose

Implements the write-side use case "delete a user" in the CQRS application layer. `DeleteUserHandler` is an Inversify `@injectable` handler that consumes a `DeleteUserCommand`, calls `IUserRepository.delete(id)`, and translates a `false` (nothing deleted) result into a `NotFoundError` (HTTP 404). It returns `void` on success.

# Responsibilities

- Register with Inversify as injectable, injecting `IUserRepository` via `TYPES.UserRepository`.
- Execute the delete-user command against the repository.
- Convert the repository's `boolean` outcome into clean application semantics: `false` → `NotFoundError('User')`.
- Return `void` on success so the HTTP layer decides the status (e.g. 204 No Content).
- Keep persistence behind the repository port.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `injectable` (from `inversify`) | decorator | Marks the class as injectable by the DI container. |
| `inject` (from `inversify`) | decorator/function | Injects the `TYPES.UserRepository`-bound implementation. |
| `DeleteUserCommand` (from `../commands/delete-user.command`) | class | The command value object carrying the `id` to delete. |
| `IUserRepository` (from `../../domain/repositories/user-repository.interface`) | interface | The repository port; `delete(id)` returns `Promise<boolean>`. |
| `TYPES` (from `../../shared/constants/tokens`) | const object | Inversify token `TYPES.UserRepository` used for injection. |
| `NotFoundError` (from `../../shared/errors`) | class | Operational error (HTTP 404, code `NOT_FOUND`) thrown when deletion reports no affected record. |

# Exports

- `DeleteUserHandler` (class)

# Internal Functions

See the `Function: execute` section below.

# Execution Flow

1. The DI container resolves `DeleteUserHandler` with the bound `IUserRepository`.
2. A controller calls `await handler.execute(command)`.
3. `execute` calls `this.userRepository.delete(command.id)`.
4. If `deleted` is `false` → throw `new NotFoundError('User')`.
5. Otherwise the method completes (returns `undefined`/void); the controller can emit 204.

# Related Files

- `src/application/commands/delete-user.command.ts` — the input contract (`DeleteUserCommand`)
- `src/application/handlers/create-user.handler.ts` — sibling write handler
- `src/application/handlers/update-user.handler.ts` — sibling write handler
- `src/application/handlers/index.ts` — barrel exporting this handler
- `src/domain/repositories/user-repository.interface.ts` — the port (`delete(id): Promise<boolean>`)
- `src/shared/constants/tokens.ts` — `TYPES.UserRepository` token
- `src/shared/errors/index.ts` — `NotFoundError` definition
- `src/application/dto/user.dto.ts` — `userIdParamsSchema` validates the route id first

# Example Usage

```ts
import { Container } from 'inversify';
import { DeleteUserHandler, DeleteUserCommand } from '../application';

const handler = container.get<DeleteUserHandler>(TYPES.DeleteUserHandler);

await handler.execute(new DeleteUserCommand('663c...id'));  // undefined on success, 404 error otherwise
```

# Best Practices

- Treat a falsy delete result as "resource missing" and throw `NotFoundError` so the API contract stays consistent with update/get.
- Return `void` (not the boolean) so callers can't accidentally use the internal repository signal.
- Let the HTTP layer decide 204 — the handler stays transport-agnostic.
- Keep the handler free of DB specifics.

# Common Mistakes

- Ignoring the `boolean` result and assuming deletion always succeeded, leaving idempotency handling to the client.
- Throwing a generic `Error` instead of `NotFoundError`, breaking status-code mapping.
- Swallowing repository exceptions — let infra errors propagate to the error middleware.
- Coupling the handler to Mongoose by importing a concrete repository.

# Notes For Frontend Developers

- Deleting a user (typically `DELETE /users/:id`) — no request body.
- Success → `204 No Content`, no payload. Don't parse a body on success.
- Unknown/removed `id` → **404 Not Found** (`User not found`). In UIs, treat this as "already gone"; offer refresh/re-select.
- Because a repeated delete of the same id may 404, disable the delete button after first success or handle the 404 gracefully.

## Function: execute

- Location: `src/application/handlers/delete-user.handler.ts:11`
- Purpose: Deletes the user identified by the command and maps the miss-case to a 404.
- Parameters:

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `command` | `DeleteUserCommand` | Yes | Immutable command carrying the `id` of the user to delete. |

- Return Type: `Promise<void>` — resolves with `undefined` on success.
- Throws:
  - `NotFoundError` — when `userRepository.delete(command.id)` resolves to `false`. Message: `'User not found'`, HTTP 404.
- Called By:
  - API controller / mediator for the user delete route.
  - CQRS command dispatcher.
  - Tests (mocked repository).
- Calls:
  - `this.userRepository.delete(command.id)`
- Execution Flow:
  1. `const deleted = await this.userRepository.delete(command.id)`.
  2. If `!deleted` → `throw new NotFoundError('User')`.
  3. Otherwise return (void).
- Example Input:
  ```ts
  new DeleteUserCommand('663c...id')
  ```
- Example Output:
  `undefined` (success). On miss: 404 `NotFoundError`.
- Business Logic:
  - The repository reports whether a record was actually deleted (`boolean`); `false` equates to "not found" and becomes an operational error.
  - Success is represented purely by control flow (no return value), a clean void-contract for the write side.
- Edge Cases:
  - Non-existent id → `false` → `NotFoundError(404)`.
  - Id of a user already deleted concurrently → same 404 path.
  - Empty-string id → repository-dependent; the DTO layer (`userIdParamsSchema`) is expected to reject it before reaching here.
- Notes: Deleting is intentionally irreversible in this use case (no soft-delete flag exists on the handler). Compare with `UpdateUserHandler.execute` which has the same null/false → 404 mapping.