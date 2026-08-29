# File Name

`delete-user.command.ts`

# File Path

`src/application/commands/delete-user.command.ts`

# Purpose

Defines the `DeleteUserCommand` class, an immutable CQRS command for the write side that carries the single piece of information needed to delete a user: the user's `id`. It is executed by `DeleteUserHandler`.

# Responsibilities

- Carry the required `id` identifying which user to delete.
- Preserve immutability via the `readonly` `id` property.
- Act as the typed, structural message from the API controller (e.g. `DELETE /users/:id`) to the delete handler.
- Carry no behavior; deletion logic lives in the handler and repository.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| *(none)* | — | This file imports nothing and depends on no external libraries. |

# Exports

- `DeleteUserCommand` (class)

# Internal Functions

None. The class contains only a constructor and one public readonly field.

# Execution Flow

1. The API layer validates the route parameter (usually with `userIdParamsSchema` from `src/application/dto/user.dto.ts`).
2. The controller constructs `new DeleteUserCommand(req.params.id)`.
3. The command instance is passed to `DeleteUserHandler.execute(command)`.
4. The handler calls `userRepository.delete(command.id)` and throws `NotFoundError` if deletion reports failure.

# Related Files

- `src/application/commands/create-user.command.ts` — companion create-command
- `src/application/commands/update-user.command.ts` — companion update-command
- `src/application/commands/index.ts` — barrel exporting this class
- `src/application/handlers/delete-user.handler.ts` — the handler that executes this command
- `src/application/dto/user.dto.ts` — `userIdParamsSchema` validates the `id` route parameter
- `src/domain/repositories/user-repository.interface.ts` — `IUserRepository.delete(id): Promise<boolean>`

# Example Usage

```ts
// Controller handling DELETE /users/:id
const { id } = userIdParamsSchema.parse(req.params);

const command = new DeleteUserCommand(id);
await deleteUserHandler.execute(command);

res.status(204).send();
```

# Best Practices

- Keep the command minimal — an id-only command signals clear single responsibility.
- Use `readonly` to prevent mutation after dispatch.
- Validate the `id` shape (non-empty string, valid ObjectId if applicable) in the DTO layer before constructing the command; keep the command itself dumb.
- Return `void` from the handler execution and let the HTTP layer decide the status code (e.g. 204).

# Common Mistakes

- Adding more fields than needed; deletion typically only needs the id.
- Constructing the command without validating the id format, leading to repository-level casting errors downstream.
- Directly calling `userRepository.delete` from the controller instead of going through the command/handler pipeline, which breaks the CQRS uniform command flow and error mapping.

# Notes For Frontend Developers

- Deleting a user is typically `DELETE /users/:id` — the whole URL path is the command; there is no request body needed for this operation.
- A successful delete usually returns `204 No Content` (no JSON body).
- Requesting deletion of an unknown id returns a 404 `NOT_FOUND` error (`NotFoundError`), so you should surface that state in the UI.
- The `id` in the URL must be a non-empty, valid identifier string (validated server-side by `userIdParamsSchema`).

## Function: DeleteUserCommand

- Location: `src/application/commands/delete-user.command.ts:1`
- Purpose: Immutable command containing the id of the user to delete.
- Parameters:

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Identifier of the user to delete. Stored as `public readonly id`. |

- Return Type: A new `DeleteUserCommand` instance.
- Throws: Nothing (trivial constructor).
- Called By:
  - API controller handling the delete route.
  - Tests that instantiate the command directly.
- Calls: Nothing (pure value holder).
- Execution Flow:
  1. Constructor assigns `id` to `public readonly id`.
  2. Instance is passed to `DeleteUserHandler.execute`.
- Example Input:
  ```ts
  new DeleteUserCommand('663c...id')
  ```
- Example Output:
  ```
  DeleteUserCommand { id: '663c...id' }
  ```
- Business Logic: None embedded — pure data carrier. The repository decides whether the record actually existed (`Promise<boolean>`), and the handler maps a `false` result to a 404.
- Edge Cases:
  - Empty string id: compile-time legal; should be rejected upstream by `userIdParamsSchema` (`id: z.string().min(1)`).
  - Non-existent id: the handler throws `NotFoundError('User')` → HTTP 404.
  - Duplicate/concurrent deletes: the repository's boolean result makes the second delete either idempotent-success or a 404, depending on implementation.
- Notes: Id-only commands are the simplest CQRS command shape and are trivially testable.