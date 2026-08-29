# File Name
`tokens.ts`

# File Path
`src/shared/constants/tokens.ts`

# Purpose
Defines the central dependency-injection (IoC) token container for the whole application. Each key maps to a unique `Symbol.for(...)` identifier used to bind and resolve implementations in the InversifyJS-style container. Centralising these symbols guarantees stable, collision-free binding names across modules.

# Responsibilities
- Declare every IoC binding token used by the application.
- Provide a typed (`as const`) object so keys and symbol identities are compile-time safe.
- Serve as the single source of truth for container binding names, preventing typos and hard-coded string mismatches.

# Dependencies
No imports. This file is fully self-contained.

# Exports
- `TYPES` — A `const` object (readonly via `as const`) whose keys and values are:
  - `UserRepository`: `Symbol.for('IUserRepository')` — token for the user persistence/repository implementation.
  - `CreateUserHandler`: `Symbol.for('CreateUserHandler')` — token for the CreateUser command handler.
  - `UpdateUserHandler`: `Symbol.for('UpdateUserHandler')` — token for the UpdateUser command handler.
  - `DeleteUserHandler`: `Symbol.for('DeleteUserHandler')` — token for the DeleteUser command handler.
  - `GetUserByIdHandler`: `Symbol.for('GetUserByIdHandler')` — token for the GetUserById query handler.
  - `GetAllUsersHandler`: `Symbol.for('GetAllUsersHandler')` — token for the GetAllUsers query handler.

# Internal Functions
None. `TYPES` is a plain object literal, not a function.

## Function: TYPES (constant object)
- Location: `src/shared/constants/tokens.ts:1`
- Purpose: Central registry of IoC binding tokens so the container can bind and resolve concrete implementations by a stable symbol identity.
- Parameters: None (object literal).
- Return Type: `{ readonly UserRepository: symbol; readonly CreateUserHandler: symbol; readonly UpdateUserHandler: symbol; readonly DeleteUserHandler: symbol; readonly GetUserByIdHandler: symbol; readonly GetAllUsersHandler: symbol }` (an `as const`-typed object).
- Throws: Nothing.
- Called By: Application composition root / IoC container wiring (e.g. container `bind`/`get` calls), and any class consuming injected dependencies.
- Calls: Nothing.
- Execution Flow:
  1. Define each handler/repository token by its `Symbol.for(...)` key.
  2. Freeze the object shape with `as const`.
  3. Importers use `TYPES.X` to both bind and resolve.
- Example Input: N/A (not a function).
- Example Output:
  ```ts
  TYPES.UserRepository === Symbol.for('IUserRepository') // true
  TYPES.GetAllUsersHandler === Symbol.for('GetAllUsersHandler') // true
  ```
- Business Logic: None; purely identity mapping between a named binding and a unique global symbol.
- Edge Cases:
  - `Symbol.for` is idempotent globally, so re-running the module or importing elsewhere returns the same symbol (avoids duplicate registrations).
  - Adding a new dependency requires adding a token here and wiring it in the container.
- Notes: Because these are `Symbol.for` values, they survive across module duplication and can be used by multiple containers within the same Node process.

# Execution Flow
1. Module evaluates the object literal and creates six `Symbol.for(...)` entries.
2. `TYPES` is exported and consumed by the container composition root and by injection decorators/annotations.

# Related Files
- `src/shared/constants/index.ts`
- `src/shared/index.ts`
- Container composition root (bindings for repositories and CQRS handlers).

# Example Usage
```ts
import { TYPES } from '../../shared';

container.bind<IUserRepository>(TYPES.UserRepository).to(MongooseUserRepository);
container.bind<CreateUserHandler>(TYPES.CreateUserHandler).to(CreateUserHandler);

// Resolution
const userRepo = container.get<IUserRepository>(TYPES.UserRepository);
```

# Best Practices
- Always reference tokens via `TYPES.<name>`; never hard-code the symbol strings in container files.
- Register a token for every bindable dependency (repositories, handlers, services).
- Keep the object `as const` to get compile-time key safety.

# Common Mistakes
- Typing or misspelling a token name, which causes a silent `undefined` binding at runtime.
- Using plain strings instead of `Symbol.for`, risking collisions with built-in or third-party symbols.
- Forgetting to register a new handler/repository token when adding a new CQRS handler.

# Notes For Frontend Developers
Internal-only. Symbols and token names are never part of the HTTP contract. API consumers only interact with the standard success/error/pagination response shapes documented elsewhere in this shared layer.
