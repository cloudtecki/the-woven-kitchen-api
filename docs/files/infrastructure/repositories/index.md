# repositories/index.ts

# File Path
`src/infrastructure/repositories/index.ts`

# Purpose
This is the barrel (aggregator) file for the `repositories` sub-module within the infrastructure layer. It exposes the `UserRepository` implementation as the public symbol of the repository layer, so consumers never import directly from `user.repository.ts`. It is re-exported upward by the root `infrastructure/index.ts` barrel.

The file contains no logic — it only re-exports the concrete repository.

# Responsibilities
- Re-export the `UserRepository` class as a value export.
- Provide the canonical import path `.../infrastructure/repositories` for repository implementations.
- Establish the pattern that future repository implementations should follow (one file plus a barrel entry here).

# Dependencies

| Import | Path | Explanation |
| --- | --- | --- |
| `UserRepository` (value re-export) | `./user.repository` | The concrete infrastructure repository implementing `IUserRepository`. |

Transitively, loading this barrel loads `./user.repository.ts`, which pulls in `inversify`, `mongoose`, the user model, and the domain contracts. This barrel itself declares **no `import` statements** and no new code.

# Exports
- `UserRepository` — value export (the `@injectable` class implementing `IUserRepository`).

No new named exports, classes, types, constants, or symbols are declared here; it forwards only `UserRepository` from `./user.repository`.

# Internal Functions
None. Pure barrel file.

# Execution Flow
1. The module evaluates `export { UserRepository } from './user.repository';`.
2. Loading `./user.repository` evaluates the `UserRepository` class definition.
3. `UserRepository` is registered as a named export.
4. Module load completes; `UserRepository` is available from this barrel and the root `infrastructure` barrel.

# Related Files
- `src/infrastructure/repositories/user.repository.ts` — the implementation forwarded here.
- `src/infrastructure/index.ts` — root barrel with `export * from './repositories'`.
- `src/infrastructure/di/container.ts` — binds `IUserRepository` → `UserRepository` (imports the class directly).
- `src/domain/repositories/user-repository.interface.ts` — the interface `UserRepository` implements.

# Example Usage
```ts
import { UserRepository } from './infrastructure/repositories';
// Usually resolved via the container, but direct instantiation is possible:
const repo = new UserRepository();
```

# Best Practices
- Access repositories through this barrel (or resolve via the container) rather than deep-importing `user.repository.ts`.
- Add a new barrel entry for every new repository implementation.

# Common Mistakes
- Importing `UserRepository` directly from `user.repository.ts`, bypassing the barrel.
- Adding a new repository to a deep file but forgetting to add it here.
- Assuming the barrel re-exports the interface `IUserRepository` — it does not (that lives in the domain layer).

# Notes For Frontend Developers
- The frontend does not use repositories directly; it consumes the HTTP API backed by these persistence adapters.
- All user data mutations you perform in the UI ultimately flow through `UserRepository`, including the email-lowercasing and role handling described in `user.repository.ts`.

---

## Function: (none)

This barrel file defines no functions or methods.
