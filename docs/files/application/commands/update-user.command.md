# File Name

`update-user.command.ts`

# File Path

`src/application/commands/update-user.command.ts`

# Purpose

Defines the `UpdateUserCommand` class, an immutable CQRS command that carries the identifiers and optional patch fields required to update an existing admin user. It is the write-model counterpart to `UpdateUserHandler` and conveys which entity to change (`id`) and which of the updatable fields (`name`, `role`, `isActive`) should be changed.

# Responsibilities

- Identify the target user via a required `id`.
- Carry the optional, partial update fields: `name`, `role`, `isActive`.
- Preserve immutability with `readonly` properties so the payload cannot be mutated after dispatch.
- Keep the update semantics optional: an omitted field means "do not change" (partial update / PATCH semantics) rather than "clear the value".
- Decouple the API controller that assembles the patch from the handler that applies it.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `UserRole` (from `../../domain/value-objects/user-role`) | value | The `UserRole` enum used to type the optional `role` parameter. Possible values: `'ADMIN' | 'MANAGER' | 'STAFF'`. |

No other imports or libraries are used in this file.

# Exports

- `UpdateUserCommand` (class)

# Internal Functions

None. The class has a constructor and public readonly fields only.

# Execution Flow

1. The API layer validates the incoming patch body, usually with `updateUserSchema` from `src/application/dto/user.dto.ts`.
2. A controller constructs `new UpdateUserCommand(id, name, role, isActive)`.
3. The instance is passed to `UpdateUserHandler.execute(command)`.
4. The handler forwards `command.id` and the patch object to `userRepository.update(...)`.
5. If the repository returns `null` (no matching user), the handler throws `NotFoundError`.

# Related Files

- `src/application/commands/create-user.command.ts` — companion create-command
- `src/application/commands/delete-user.command.ts` — companion delete-command
- `src/application/commands/index.ts` — barrel exporting this class
- `src/application/handlers/update-user.handler.ts` — the handler that executes this command
- `src/application/dto/user.dto.ts` — `updateUserSchema` validates the raw patch input
- `src/domain/repositories/user-repository.interface.ts` — `UpdateUserData` mirrors the updatable fields
- `src/domain/value-objects/user-role.ts` — `UserRole` enum for the `role` field

# Example Usage

```ts
// Controller handling PATCH /users/:id
const input = updateUserSchema.partial().parse(req.body); // or full schema

const command = new UpdateUserCommand(req.params.id, input.name, input.role, input.isActive);
const user = await updateUserHandler.execute(command);

res.status(200).json(user);
```

# Best Practices

- Keep all update fields optional so the command naturally models partial updates.
- Use `readonly` fields; never mutate a command after it has been handed off to a handler.
- Type `role` as `UserRole`, never as a loose string.
- Differentiate "field absent" (`undefined`/omitted) from "field provided" when building the patch; the repository treats `undefined` as no-op.
- Name commands in the imperative sense of the action (`UpdateUserCommand`).

# Common Mistakes

- Passing partial fragments that include `undefined` values explicitly — the repository contract (`UpdateUserData`) expects optional `undefined` to mean "unchanged", so ensure you don't default to `null` accidentally.
- Making `id` optional — it is the required discriminator for the target record.
- Allowing `isActive` to be a generic type that lets non-boolean values through; use `boolean`.
- Omitting the class from `src/application/commands/index.ts`, breaking the barrel export.

# Notes For Frontend Developers

- For updates (typically `PATCH /users/:id`), send only the fields you want to change, e.g. `{ "role": "MANAGER" }` or `{ "isActive": false }` or `{ "name": "New Name" }`.
- `name` is validated to 1–100 characters and `role` must be one of `"ADMIN"`, `"MANAGER"`, `"STAFF"`; `isActive` must be a boolean — otherwise the request is rejected by `updateUserSchema` before reaching the command.
- Omitting a field means "leave it unchanged" — never send `null` to clear a value, since the schema types do not accept `null`.
- Updating a non-existent `id` returns a 404 `NOT_FOUND` error (`NotFoundError`).

## Function: UpdateUserCommand

- Location: `src/application/commands/update-user.command.ts:3`
- Purpose: Immutable command carrying the id and optional patch fields for updating a user.
- Parameters:

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `id` | `string` | Yes | MongoDB/ObjectId identifier (as a string) of the user to update. Stored as `public readonly id`. |
| `name` | `string` | No | New display name to set. Stored as `public readonly name`. |
| `role` | `UserRole` | No | New role to assign; member of the `UserRole` enum. Stored as `public readonly role`. |
| `isActive` | `boolean` | No | New active/disabled state for the user. Stored as `public readonly isActive`. |

- Return Type: A new `UpdateUserCommand` instance.
- Throws: Nothing (trivial constructor; validation performed upstream).
- Called By:
  - API controller code that builds the command with the route `id` and validated patch body.
  - Tests constructing commands directly.
- Calls: Nothing (pure value holder).
- Execution Flow:
  1. Constructor assigns each argument to a `public readonly` instance property.
  2. Instance is passed to `UpdateUserHandler.execute`.
- Example Input:
  ```ts
  new UpdateUserCommand('663c...id', 'Bob', UserRole.ADMIN, false)
  ```
- Example Output:
  ```
  UpdateUserCommand {
    id: '663c...id',
    name: 'Bob',
    role: 'ADMIN',
    isActive: false
  }
  ```
- Business Logic: None embedded — pure data carrier for the update-user use case. The handler forwards the values to the repository and maps the "no record" case to a 404.
- Edge Cases:
  - All optional fields omitted: `new UpdateUserCommand(id)` — valid; repository gets an essentially empty patch (no-op) but will still hit the database and can still return the user or `null`.
  - `isActive: false`: a boolean `false` is a real value (must be applied) — be careful not to treat it as falsy/omitted.
  - Invalid/unknown `id`: the handler throws `NotFoundError` (404) when the repository returns `null`.
- Notes: This command's payload shape matches `UpdateUserData` on `IUserRepository`, so the handler can forward a partial object directly. The `email` field is intentionally missing — email change is not supported by this command.