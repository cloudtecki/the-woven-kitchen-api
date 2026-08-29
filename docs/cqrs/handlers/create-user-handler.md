# Handler: CreateUserHandler

## File Path

`src/application/handlers/create-user.handler.ts`

## Purpose

The application-layer handler that owns the **business logic** for creating a user. It receives a `CreateUserCommand` (plain data), orchestrates repository calls, enforces uniqueness, and returns the created `User`. Handlers are the only place where commands/queries are turned into real work.

## Input

`CreateUserCommand` (`src/application/commands/create-user.command.ts`):

- `email: string`
- `name: string`
- `role?: UserRole`

## Output

`Promise<User>` — the fully persisted user entity:

```ts
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Business Logic

1. Checks whether a user with the given email already exists.
2. If it exists, rejects the creation (uniqueness constraint enforced at the application level).
3. If not, creates the user, defaulting `role` to `UserRole.STAFF` and forcing `isActive` to `true`.

## Repository Calls

- `userRepository.findByEmail(email)` — existence/duplicate check.
- `userRepository.create({ email, name, role, isActive: true })` — persistence.

Both defined on `IUserRepository` (`src/domain/repositories/user-repository.interface.ts`).

## Error Handling

- Throws `ConflictError('User with this email already exists')` when `findByEmail` returns an existing user. This surfaces as **HTTP 409 Conflict** at the API layer.

## Flow Diagram

```mermaid
flowchart TD
    A[CreateUserCommand] --> B{findByEmail(email)}
    B -- existing user --> C[throw ConflictError 409]
    B -- null --> D[create email, name, role||STAFF, isActive:true]
    D --> E[return User]
```

## Example

```ts
import { CreateUserCommand } from '../commands/create-user.command';
import { UserRole } from '../../domain/value-objects/user-role';

const cmd = new CreateUserCommand('jane@example.com', 'Jane', UserRole.ADMIN);
const user = await handler.execute(cmd);
// user.role === 'ADMIN', user.isActive === true
```
