# container.ts

# File Path
`src/infrastructure/di/container.ts`

# Purpose
This file creates and configures the application's single **InversifyJS dependency-injection container** and registers all of its bindings. It maps abstraction symbols (from `TYPES`) to their concrete implementations, primarily binding the `IUserRepository` interface to the `UserRepository` infrastructural implementation (singleton-scoped), and binding each application use-case handler (Create/Update/Delete/GetUserById/GetAllUsers) to its concrete handler class transited (request) scope.

It is the heart of the composition root for the application, wiring the domain contracts to infrastructure/application implementations. It should be loaded/imported early (e.g. at server bootstrap) so bindings are registered before any resolution.

# Responsibilities
- Instantiate the single Inversify `Container`.
- Bind `TYPES.UserRepository` (symbol `IUserRepository`) → `UserRepository` in **singleton** scope (one shared instance).
- Bind each handler token to its concrete handler class (default transient scope).
- Export the configured `container` for use throughout the application (controllers, seed script, resolvers).
- Centralize binding registration so dependency wiring is defined in one place.

# Dependencies

| Import | Path | Explanation |
| --- | --- | --- |
| `Container` | `inversify` | The Inversify DI container class used to register and resolve bindings. |
| `TYPES` | `../../shared/constants/tokens` | Symbol keys (`TYPES.UserRepository`, `TYPES.CreateUserHandler`, etc.) used as binding identifiers. |
| `IUserRepository` | `../../domain/repositories/user-repository.interface` | The domain repository interface (used as the binding type for the repository). |
| `UserRepository` | `../repositories/user.repository` | The concrete infrastructure repository implementation bound to `IUserRepository`. |
| `CreateUserHandler` | `../../application/handlers/create-user.handler` | Application use-case handler for creating a user. |
| `UpdateUserHandler` | `../../application/handlers/update-user.handler` | Application use-case handler for updating a user. |
| `DeleteUserHandler` | `../../application/handlers/delete-user.handler` | Application use-case handler for deleting a user. |
| `GetUserByIdHandler` | `../../application/handlers/get-user-by-id.handler` | Application use-case handler for fetching a user by id. |
| `GetAllUsersHandler` | `../../application/handlers/get-all-users.handler` | Application use-case handler for fetching all users. |

# Exports
- `container` — a **const** of type `Container` (the configured Inversify container instance).

No other symbols are exported; the binding registrations are side effects of module load.

# Internal Functions
None. The file has no function/method declarations; all behavior is the top-level container setup and `container.bind(...)` calls.

# Execution Flow
1. `new Container()` creates the container instance.
2. `container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope()` — registers the repository as a singleton bound to the `IUserRepository` symbol.
3. Five `container.bind(...).to(...)` calls register the handlers (Create/Update/Delete/GetUserById/GetAllUsers) bound to their `TYPES` symbols in default transient scope.
4. `export { container }` makes the fully-configured container available.
5. Downstream code imports `container` and calls `container.get<T>(TYPES.X)` to resolve dependencies.

# Related Files
- `src/shared/constants/tokens.ts` — the `TYPES` symbol keys used in all bindings.
- `src/infrastructure/repositories/user.repository.ts` — the concrete repository bound to `IUserRepository`.
- `src/domain/repositories/user-repository.interface.ts` — the interface the repository implements.
- `src/application/handlers/*.handler.ts` — the use-case handlers bound here.
- `src/infrastructure/di/index.ts` — barrel re-exporting `container`.
- `src/infrastructure/database/seed/index.ts` — consumes `container.get<IUserRepository>(TYPES.UserRepository)`.
- Likely server/composition-root files where controllers resolve handlers.

# Example Usage
```ts
import { container } from './infrastructure/di';
import { TYPES } from './shared/constants/tokens';
import { IUserRepository } from './domain/repositories/user-repository.interface';
import { CreateUserHandler } from './application/handlers/create-user.handler';

const repository = container.get<IUserRepository>(TYPES.UserRepository);
const createHandler = container.get<CreateUserHandler>(TYPES.CreateUserHandler);

const user = await createHandler.handle({ email, name, role, isActive });
```

# Best Practices
- Import this module early (composition root / server bootstrap) so bindings are registered before any `get()` calls.
- Use the `TYPES` symbols (typed `as const`, `Symbol.for(...)`) for all binding identifiers to avoid string-typo collisions.
- Prefer `inSingletonScope()` for stateful/expensive singletons (like the repository) and default transient scope for stateless handlers.
- Keep bindings declarative and grouped; add a binding whenever a new handler/repository is introduced.
- Ensure `reflect-metadata` is imported somewhere before using `container` so `@injectable`/`@inject` metadata is available.

# Common Mistakes
- Forgetting to import this module before resolving — leading to "no bindings" errors (`No matching bindings found`).
- Adding a new handler but failing to register its binding here, causing resolution to throw.
- Mis-typing the symbol key (only the `TYPES` constant should be used).
- Not importing `reflect-metadata` before container use, breaking decorator-based injection.

# Notes For Frontend Developers
- The frontend never sees this container; it is purely the server's composition mechanism.
- Effectively, `TYPES.UserRepository` maps to a single shared `UserRepository`, which is why admin/user data mutations across the API behave consistently.
- The `ADMIN` role check / behavior in the UI corresponds to the repository-backed domain data this container wires up.

---

## Function: (none)

This module's behavior is entirely in top-level container setup; it declares no functions or methods.
