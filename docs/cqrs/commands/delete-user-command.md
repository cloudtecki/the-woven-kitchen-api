# Command: DeleteUserCommand

## File Path

`src/application/commands/delete-user.command.ts`

## Purpose

Represents the intent to **permanently remove an existing user**. It is a plain DTO that carries only the identifier of the user to delete. It carries **no business logic** — it only names *which* user should be removed.

## Properties

Constructor parameters (all `public readonly`):

| Parameter | Type      | Required | Description                                        |
| --------- | --------- | -------- | -------------------------------------------------- |
| `id`      | `string`  | Yes      | The MongoDB ObjectId (as string) of the user to delete. |

## Called By

- `user.controller.ts` → `deleteUser` (HTTP `DELETE /api/users/:id`). See `src/api/controllers/user.controller.ts:160`.

```ts
await deleteUserHandler().execute(new DeleteUserCommand(id));
```

## Handled By

- `DeleteUserHandler` (`src/application/handlers/delete-user.handler.ts`)

## Flow

```mermaid
sequenceDiagram
    participant FE as Frontend Browser
    participant API as Express App (DELETE /api/users/:id)
    participant C as UserController.deleteUser
    participant H as DeleteUserHandler
    participant R as UserRepository
    participant DB as MongoDB (users)

    FE->>API: DELETE /api/users/:id
    API->>C: req.params.id
    C->>H: new DeleteUserCommand(id) |> execute()
    H->>R: delete(id)
    R->>DB: UserModel.findByIdAndDelete(id)
    DB-->>R: deleted doc (or null)
    alt doc not found / invalid id
        R-->>H: false
        H-->>C: throw NotFoundError(404)
    else doc found & deleted
        R-->>H: true
        H-->>C: void (no return)
        C-->>FE: 200 OK (message: "User deleted successfully")
    end
```

## Example

```ts
import { DeleteUserCommand } from '../../../application/commands/delete-user.command';

const command = new DeleteUserCommand('645f...');
await deleteUserHandler().execute(command);
// On success: no return value. On missing user: NotFoundError is thrown (404).
```
