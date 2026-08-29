# File Name

`index.ts` (queries barrel)

# File Path

`src/application/queries/index.ts`

# Purpose

Barrel module that aggregates and re-exports all user query classes from the application-layer queries folder. It is consumed by the application root barrel (`src/application/index.ts`) and provides a single entry point for CQRS read-side messages.

# Responsibilities

- Re-export `GetUserByIdQuery` and `GetAllUsersQuery` from their concrete file modules.
- Decouple consumers from concrete file paths inside the `queries` folder.
- Provide the read-side vocabulary of the CQRS application layer (get-one, get-many/paginated).

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `./get-user-by-id.query` | relative module | Source of `GetUserByIdQuery`. Only the named export is referenced. |
| `./get-all-users.query` | relative module | Source of `GetAllUsersQuery`. Only the named export is referenced. |

The barrel imports no runtime libraries.

# Exports

- `GetUserByIdQuery` — from `./get-user-by-id.query`
- `GetAllUsersQuery` — from `./get-all-users.query`

# Internal Functions

None. The file contains only `export { ... } from ...` statements.

# Execution Flow

1. Module is imported (directly or via `src/application/index.ts`).
2. TypeScript resolves each `export { X } from './file'` against the corresponding module.
3. The two query classes become available on the barrel's public namespace.
4. No runtime instantiation occurs at import time.

# Related Files

- `src/application/queries/get-user-by-id.query.ts` — single-user query definition
- `src/application/queries/get-all-users.query.ts` — paginated list query definition
- `src/application/index.ts` — re-exports this barrel
- `src/application/handlers/index.ts` — the matching read-side handlers barrel

# Example Usage

```ts
// Consumer imports from the queries barrel
import { GetUserByIdQuery, GetAllUsersQuery } from '../application/queries';

const single = new GetUserByIdQuery('663c...id');
const list = new GetAllUsersQuery(2, 25);
```

# Best Practices

- Register every new query in this barrel to keep the root barrel complete.
- Keep exports unidirectional; query files must not import back from the barrel.
- Prefer explicit named exports (`export { X } from`) for a controlled public surface.
- Keep the barrel free of logic.

# Common Mistakes

- Forgetting to register a newly created query, breaking barrel-based imports.
- Importing from this barrel inside handler files that are also exported here, creating circular dependencies.
- Re-exporting internal helper types and widening the public API unintentionally.

# Notes For Frontend Developers

- Server-side only; you never import this file.
- Practical consequence: `GET /users` (list) and `GET /users/:id` (single) map to the two queries here.
- List responses always include pagination envelope fields (`data`, `total`, `page`, `limit`, `totalPages`); single responses are the bare user object or a 404.