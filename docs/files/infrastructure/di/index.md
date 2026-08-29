# di/index.ts

# File Path
`src/infrastructure/di/index.ts`

# Purpose
This is the barrel (aggregator) file for the `di` sub-module within the infrastructure layer. It exposes the application's Inversify `container` as the single public symbol of the DI module, so consumers import `container` from `.../di` rather than from `container.ts` directly. It is re-exported upward by the root `infrastructure/index.ts` barrel.

The file contains no logic — it only re-exports the configured container.

# Responsibilities
- Re-export the `container` (Inversify `Container` instance) as a value export.
- Provide the canonical import path `.../infrastructure/di` for the DI container.
- Trigger the container's binding-registration side effects by loading `container.ts`.

# Dependencies

| Import | Path | Explanation |
| --- | --- | --- |
| `container` (value re-export) | `./container` | The configured Inversify container instance with all repository/handler bindings. |

Transitively, loading this barrel loads `./container.ts`, which pulls in `inversify`, `TYPES`, the repository, and all application handlers. This barrel itself declares **no `import` statements** and no new code.

# Exports
- `container` — value export (the configured Inversify `Container`).

No new named exports, classes, types, constants, or symbols are declared here; it forwards only `container` from `./container`.

# Internal Functions
None. Pure barrel file.

# Execution Flow
1. The module evaluates `export { container } from './container';`.
2. Loading `./container` executes all `container.bind(...)` registration side effects, fully configuring the container.
3. `container` is registered as a named export.
4. Module load completes; `container` is now available from this barrel and from the root `infrastructure` barrel.

# Related Files
- `src/infrastructure/di/container.ts` — the actual implementation / binding registrations forwarded here.
- `src/infrastructure/index.ts` — root barrel with `export * from './di'`.
- Consumers of `container`: seed script, controllers, server composition.

# Example Usage
```ts
import { container } from './infrastructure/di';
import { TYPES } from './shared/constants/tokens';
import { IUserRepository } from './domain/repositories/user-repository.interface';

const repo = container.get<IUserRepository>(TYPES.UserRepository);
```

# Best Practices
- Always access the container through this barrel (or the root `infrastructure` barrel), never by deep-importing `container.ts`.
- Ensure this module (or `container.ts`) is imported early so bindings are registered before resolution.

# Common Mistakes
- Importing `container` directly from `container.ts`, bypassing the barrel.
- Forgetting to import the barrel/container module before calling `container.get(...)`, which yields "no bindings" errors.
- Attempting to create a second `Container` elsewhere; there should be exactly one shared container.

# Notes For Frontend Developers
- The frontend has no interaction with the DI container; it is server-internal wiring.
- The singleton behavior of the user repository is what ensures consistent default `role` (`STAFF`) and `isActive` (`true`) behavior reflected in API-created users.

---

## Function: (none)

This barrel file defines no functions or methods.
