# File Name

`create-user.command.ts`

# File Path

`src/application/commands/create-user.command.ts`

# Purpose

Defines the `CreateUserCommand` class, an immutable data-transfer object (record) used in the CQRS write model. It carries all of the (incoming) data needed to create an admin user from the presentation layer to the write side handler (`CreateUserHandler`). Because the class is a pure value holder with a readonly constructor, it doubles as both the command contract and the input payload.

# Responsibilities

- Encapsulate the fields required to create a user: `email`, `name`, and an optional `role`.
- Enforce immutability of the command payload via `readonly` properties and an assignment-taking constructor.
- Act as the typed message sent over the "write" pipeline of the CQRS architecture.
- Decouple the API controller (which creates the command) from the handler (which consumes it). The handler never sees the raw request body — only the command.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `UserRole` (from `../../domain/value-objects/user-role`) | value | The `UserRole` enum from the domain layer, used only as the type of the optional `role` parameter. Values are `'ADMIN' | 'MANAGER' | 'STAFF'`. See `docs/files/domain/value-objects/user-role.md` (if generated) for detail. |

There are no other runtime imports. No external libraries are used in this file.

# Exports

- `CreateUserCommand` (class)

# Internal Functions

None. `CreateUserCommand` is a class with a constructor and public readonly fields; it defines no standalone functions.

# Execution Flow

1. The presentation layer validates the input (usually with `createUserSchema` from `src/application/dto/user.dto.ts`).
2. Somewhere in the API layer, `new CreateUserCommand(email, name, role)` is constructed.
3. The command instance is passed to `CreateUserHandler.execute(command)`.
4. The handler reads `command.email`, `command.name`, and `command.role` and performs the persistence logic.
5. No validation occurs inside the command itself — validation is expected to have happened earlier in the pipeline.

# Related Files

- `src/application/commands/update-user.command.ts` — companion update-command (same pattern)
- `src/application/commands/delete-user.command.ts` — companion delete-command
- `src/application/commands/index.ts` — barrel that exports this class
- `src/application/handlers/create-user.handler.ts` — the handler that executes this command
- `src/application/dto/user.dto.ts` — `createUserSchema` used to validate the raw input before constructing this command
- `src/domain/value-objects/user-role.ts` — the `UserRole` enum referenced by the `role` field
- `src/domain/repositories/user-repository.interface.ts` — `CreateUserData` matches the fields carried by this command

# Example Usage

```ts
// Controller / API route layer
const input = createUserSchema.parse(req.body);

const command = new CreateUserCommand(input.email, input.name, input.role);
const user = await userHandler.execute(command);

res.status(201).json(user);
```

# Best Practices

- Keep commands lightweight and immutable: only fields, no behavior, no validation logic.
- Build commands from already-validated input; do not re-validate inside the command or handler.
- Make fields `readonly` so a command cannot be mutated after dispatch.
- Keep the optional `role` typed as `UserRole` (never a raw string) so invalid roles are impossible at compile time.
- Name commands in the imperative tense of the action they describe (`CreateUserCommand`).

# Common Mistakes

- Putting validation or business logic inside the command class — it should be a dumb value object.
- Passing mutable objects into the constructor, allowing the payload to change after dispatch.
- Accepting `role` as a plain `string`; this bypasses the enum type-safety and can crash handlers that switch on `UserRole`.
- Forgetting to add the class to `src/application/commands/index.ts`, which breaks the barrel export and any consumer importing from `src/application`.

# Notes For Frontend Developers

- When you POST to the create-user endpoint, the backend expects a JSON body shaped like this command: `{ "email": "a@b.c", "name": "Alice", "role": "STAFF" }`.
- `role` is optional from the server's perspective — if omitted, the handler defaults it to `UserRole.STAFF`. The valid values are the uppercase strings `"ADMIN"`, `"MANAGER"`, `"STAFF"`.
- `email` must be a valid email and `name` must be 1–100 characters (enforced by `createUserSchema`). Sending an invalid body returns a validation response before the command is ever constructed.
- Submitting an email that already exists causes a 409 `CONFLICT` error (`ConflictError`) thrown by the handler.
- Field names in your request body match exactly the command property names: `email`, `name`, `role`.

## Function: CreateUserCommand

- Location: `src/application/commands/create-user.command.ts:3`
- Purpose: Immutable command/value object carrying the data required to create a new user.
- Parameters:

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `email` | `string` | Yes | The user's email address. Stored as `public readonly email`. |
| `name` | `string` | Yes | The user's display name. Stored as `public readonly name`. |
| `role` | `UserRole` | No | The user's role; must be a member of the `UserRole` enum (`ADMIN`, `MANAGER`, `STAFF`). Stored as `public readonly role`. If omitted the handler defaults to `UserRole.STAFF`. |

- Return Type: A new `CreateUserCommand` instance.
- Throws: Nothing (constructor is trivial; no validation performed).
- Called By:
  - Presentation/API layer code that constructs the command before dispatching to `CreateUserHandler`.
  - Tests that instantiate commands directly.
- Calls: Nothing (pure value holder).
- Execution Flow:
  1. The constructor assigns each argument to a `public readonly` instance property.
  2. The instance is ready to be passed to `CreateUserHandler.execute`.
- Example Input:
  ```ts
  new CreateUserCommand('alice@corp.com', 'Alice Wonderland', UserRole.MANAGER)
  ```
- Example Output:
  ```
  CreateUserCommand {
    email: 'alice@corp.com',
    name: 'Alice Wonderland',
    role: 'MANAGER'
  }
  ```
- Business Logic: None embedded — the command is a pure data carrier for the create-user use case. Defaulting of `role` to `STAFF` and duplicate-email checks happen in `CreateUserHandler`.
- Edge Cases:
  - `role` omitted or `undefined`: allowed by the type system; handler falls back to `UserRole.STAFF`.
  - Empty `email`/`name` strings: compile-time legal but should be caught earlier by `createUserSchema` validation.
  - `null` for `email`: not valid per the javascript runtime if interpolated, but the constructor itself does not enforce it.
- Notes: Because the fields are `readonly`, reassignment anywhere else is a compile error. This class intentionally shares its shape with `CreateUserData` on `IUserRepository`.