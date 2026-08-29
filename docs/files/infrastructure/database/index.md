# database/index.ts

# File Path
`src/infrastructure/database/index.ts`

# Purpose
This is the barrel (aggregator) file for the `infrastructure/database` sub-module. It centralizes the public exports of the database infrastructure — namely the Mongoose connection layer and the data models — into a single import point. It exists so that the rest of the application (and the parent `infrastructure` barrel) can import all database-related infrastructure from `src/infrastructure/database` without reaching into the `mongoose` or `models` subdirectories.

The file contains no logic; it only re-exports the two child modules.

# Responsibilities
- Re-export the Mongoose connection infrastructure (`MongoConnection`) from the `mongoose` sub-module.
- Re-export all Mongoose models (`UserModel`, `UserDocument`) from the `models` sub-module.
- Provide a single aggregation point for the database layer's public API.
- Enforce load ordering so models and the connection are registered before they are used elsewhere.

# Dependencies
This file has **no explicit `import` statements**; it uses `export *` re-exports. Its transitive dependencies are:

| Import | Path | Explanation |
| --- | --- | --- |
| Everything from `./mongoose` | `src/infrastructure/database/mongoose/index.ts` | Re-exports `MongoConnection`. Inductively loads `mongoose`, `../../../config`, `../../../shared/utils/logger`, and the `mongoose/connection.ts` implementation. |
| Everything from `./models` | `src/infrastructure/database/models/index.ts` | Re-exports `UserModel` and the `UserDocument` type. Inductively loads `mongoose` and `./models/user.model.ts`. |

Notably, the `seed` sub-module is **not** re-exported here; the seeder is invoked directly from `src/infrastructure/database/seed/index.ts` as a standalone script and is not part of this public barrel.

# Exports
Union of the re-exported child modules:
- `MongoConnection` — the singleton Mongo connection manager class (from `./mongoose`).
- `UserModel` — the Mongoose user model (from `./models`).
- `UserDocument` — the inferred user document type (from `./models`, a type-only export).

This file declares **no** new named exports, classes, types, constants, or symbols of its own.

# Internal Functions
None. This is a pure barrel file.

# Execution Flow
1. The runtime evaluates `export * from './mongoose'`, which loads `src/infrastructure/database/mongoose/index.ts` → `src/infrastructure/database/mongoose/connection.ts`, registering `MongoConnection`.
2. The runtime evaluates `export * from './models'`, which loads `src/infrastructure/database/models/index.ts` → `src/infrastructure/database/models/user.model.ts`, registering `UserModel` and the `UserDocument` type.
3. Module load completes; callers can `import { MongoConnection, UserModel } from '.../database'`.

# Related Files
- `src/infrastructure/database/mongoose/index.ts` — child barrel for connection infrastructure.
- `src/infrastructure/database/models/index.ts` — child barrel for data models.
- `src/infrastructure/index.ts` — parent barrel that re-exports this module.
- `src/infrastructure/database/seed/index.ts` — standalone seeding script (not re-exported here).

# Example Usage
```ts
import { MongoConnection, UserModel } from './infrastructure/database';

// Connect once and reuse the singleton
const conn = MongoConnection.getInstance();

// Access the model directly for ad-hoc queries or schema init
await UserModel.init();
```

# Best Practices
- Keep this barrel limited to models and connection; do not add execution logic here.
- If a new model is added (e.g. `OrderModel`), add it under `models` and re-export it via `models/index.ts` (this barrel then forwards it automatically).
- Prefer aggregating connectivity and models here rather than exposing raw Mongoose internals.

# Common Mistakes
- Expecting the `seed` module to be available here — it is intentionally excluded and must be imported from its own path.
- Adding logic to a barrel file, defeating the aggregator pattern.
- Forgetting to update `models/index.ts` when adding a model, which silently breaks this barrel's `export *`.

# Notes For Frontend Developers
- This module describes the persistence layer. The frontend never touches it; it sees data through the HTTP API only.
- The `UserModel` here maps to the `users` collection; the `role` enum (`ADMIN`, `MANAGER`, `STAFF`) and `isActive` boolean are exactly the values surfaced in admin API responses.
- `UserDocument` reflects the raw document including `_id`, `createdAt`, and `updatedAt`; both date fields are ISO-8601 strings in JSON output.

---

## Function: (none)

This barrel file defines no functions or methods.
