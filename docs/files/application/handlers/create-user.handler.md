# File Name

`create-user.handler.ts`

# File Path

`src/application/handlers/create-user.handler.ts`

# Purpose

Implements the write-side use case "create a user" in the CQRS application layer. `CreateUserHandler` is a dependency-injectable handler (Inversify `@injectable`) that consumes a `CreateUserCommand`, enforces the uniqueness business rule ("email must not already exist"), and persists the user through the `IUserRepository` port. It returns the newly created domain `User` entity.

# Responsibilities

- Register itself with Inversify as an injectable, constructor-injecting the `IUserRepository` implementation bound to `TYPES.UserRepository`.
- Execute the create-user command against the repository.
- Enforce the unique-email invariant by pre-checking `findByEmail` and throwing `ConflictError` (HTTP 409) on duplicates.
- Default the `role` to `UserRole.STAFF` when the command does not provide one.
- Default `isActive` to `true` so new users start active.
- Delegate all persistence to the repository port (no Mongo/Express knowledge here).

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `injectable` (from `inversify`) | decorator | Marks the class as available for Inversify's constructor-injection container. |
| `inject` (from `inversify`) | decorator/function | Injects the bound dependency; used with `@inject(TYPES.UserRepository)`. |
| `CreateUserCommand` (from `../commands/create-user.command`) | class | The command value object consumed by `execute`. |
| `IUserRepository` (from `../../domain/repositories/user-repository.interface`) | interface | The repository port (abstraction) used to query/insert users from the domain layer. |
| `User` (from `../../domain/entities/user.entity`) | interface | The domain entity type returned by `execute`. |
| `UserRole` (from `../../domain/value-objects/user-role`) | enum | Used as the default `role` (`UserRole.STAFF`) when the command omits it. |
| `TYPES` (from `../../shared/constants/tokens`) | const object | Inversify binding tokens (`TYPES.UserRepository` here) linking the interface to an implementation. |
| `ConflictError` (from `../../shared/errors`) | class | Operational error thrown when the email already exists (HTTP 409, code `CONFLICT`). |

# Exports

- `CreateUserHandler` (class)

# Internal Functions

See the `Function: execute` section below (the only method on the class).

# Execution Flow

1. The DI container resolves `CreateUserHandler`, providing the concrete `IUserRepository` bound at composition root.
2. A controller (or mediator) calls `await handler.execute(command)`.
3. `execute` calls `userRepository.findByEmail(command.email)`.
4. If a record is found → throws `new ConflictError('User with this email already exists')`.
5. Otherwise calls `userRepository.create({ email, name, role: command.role || UserRole.STAFF, isActive: true })`.
6. The repository persists and returns the created `User` entity, which `execute` returns (bubbling up to the caller for serialization).

# Related Files

- `src/application/commands/create-user.command.ts` — the input contract (`CreateUserCommand`)
- `src/application/handlers/update-user.handler.ts` — sibling write handler
- `src/application/handlers/delete-user.handler.ts` — sibling write handler
- `src/application/handlers/index.ts` — barrel exporting this handler
- `src/domain/repositories/user-repository.interface.ts` — the port (`findByEmail`, `create`, `CreateUserData`)
- `src/domain/entities/user.entity.ts` — the `User` return type
- `src/domain/value-objects/user-role.ts` — enum used for defaulting
- `src/shared/constants/tokens.ts` — `TYPES.UserRepository` token
- `src/shared/errors/index.ts` — `ConflictError` definition

# Example Usage

```ts
import { Container } from 'inversify';
import { CreateUserHandler, CreateUserCommand } from '../application';

const handler = container.get<CreateUserHandler>(TYPES.CreateUserHandler);

const command = new CreateUserCommand('alice@corp.com', 'Alice', UserRole.STAFF);
const user = await handler.execute(command);   // throws ConflictError if email exists
```

# Best Practices

- Keep the handler pure application logic: unique-email rule + defaults; delegate storage to the repository.
- Throw domain/operational errors (`ConflictError`) rather than generic `Error` so the HTTP layer can derive status codes.
- Use constructor injection with interface tokens, never importing concrete repositories into the handler.
- Do not perform validation here — `createUserSchema` already validated shape at the edge; `execute` only adds the uniqueness rule.

# Common Mistakes

- Checking `findByEmail` and then calling `create` outside a transaction/unique index — a race between two concurrent creates could both pass the check; rely on a DB unique index as final backstop.
- Throwing a bare `Error('duplicate')` that the error middleware can't map to a 409.
- Directly importing the Mongoose repository into the handler, coupling the application layer to the infrastructure layer.
- Re-running zod validation inside the handler (the command is already the validated payload).

# Notes For Frontend Developers

- A successful create → 201 with the created user object (including `id`, `createdAt`, `updatedAt`, `role`, `isActive: true`).
- Registering an email that already exists → **409 Conflict** with message `User with this email already exists`; show inline "email already in use" rather than a generic failure.
- `role` is optional; omit it and the new user becomes `STAFF`. Use `"ADMIN"`/`"MANAGER"`/`"STAFF"` case-sensitively if you send it.
- Expect the response `isActive` field to be `true` for new users.

## Function: execute

- Location: `src/application/handlers/create-user.handler.ts:13`
- Purpose: Executes the create-user use case: validates email uniqueness, defaults role/active state, and persists a new user.
- Parameters:

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `command` | `CreateUserCommand` | Yes | Immutable command carrying `email`, `name`, and optional `role` for the user to create. |

- Return Type: `Promise<User>` — the persisted domain user entity (with `id`, `createdAt`, `updatedAt`).
- Throws:
  - `ConflictError` — when `userRepository.findByEmail(command.email)` returns an existing user. Message: `'User with this email already exists'` → HTTP 409.
- Called By:
  - API controller / mediator for the `POST /users` route.
  - CQRS command dispatcher.
  - Unit/integration tests (with mocked `IUserRepository`).
- Calls:
  - `this.userRepository.findByEmail(command.email)`
  - `this.userRepository.create({ email, name, role, isActive })`
- Execution Flow:
  1. `await this.userRepository.findByEmail(command.email)`.
  2. If result is truthy → `throw new ConflictError('User with this email already exists')`.
  3. Else call `this.userRepository.create({ email: command.email, name: command.name, role: command.role || UserRole.STAFF, isActive: true })`.
  4. Return the created `User`.
- Example Input:
  ```ts
  new CreateUserCommand('alice@corp.com', 'Alice Wonderland', UserRole.MANAGER)
  ```
- Example Output:
  ```ts
  User {
    id: '663c1234abcd5678ef901234',
    email: 'alice@corp.com',
    name: 'Alice Wonderland',
    role: 'MANAGER',
    isActive: true,
    createdAt: 2026-08-27T10:00:00.000Z,
    updatedAt: 2026-08-27T10:00:00.000Z,
  }
  ```
- Business Logic:
  - Uniqueness invariant: an existing email prevents creation (fail fast before insert).
  - Defaulting rules: `role = command.role || UserRole.STAFF` (falsy role → STAFF); `isActive` hardcoded `true`.
  - Creation payload shape matches `CreateUserData` on the repository interface.
- Edge Cases:
  - `command.role === undefined` → role defaults to `UserRole.STAFF`.
  - Command with empty/duplicate email already in DB → `ConflictError`.
  - Two concurrent requests with the same email → both may pass `findByEmail`; the DB unique index must be the final guard (recommended).
- Notes: This handler is intentionally thin — all persistence behavior lives behind the `IUserRepository` port, keeping the application layer framework- and Mongo-agnostic.