# infrastructure/index.ts

# File Path
`src/infrastructure/index.ts`

# Purpose
This is the public barrel (aggregator) file for the entire **infrastructure layer**. Its sole responsibility is to re-export the public surface of every sub-module within the infrastructure layer, so that consumers (the application composition root, server bootstrap, or any other layer) can import infrastructure pieces from a single, stable entry point without reaching into internal directory structures.

The file has no logic of its own — it exists purely to control and centralize the layer's public API surface and to guarantee the correct load order of its child modules.

# Responsibilities
- Re-export all public exports from the `database` sub-module.
- Re-export all public exports from the `repositories` sub-module.
- Re-export all public exports from the `di` sub-module.
- Provide a single import entry point: `import { ... } from 'src/infrastructure'` or `import * as infrastructure from './infrastructure'`.
- Establish a stable public contract so internal file restructuring does not break external consumers.
- Ensure that importing the infrastructure layer pulls in database models, repositories, and the DI container as one coherent unit.

# Dependencies
This module has **no direct imports** (no `import` statements). However, because it uses static re-export statements, it transitively depends on every module that is re-exported. Those indirect dependencies are:

| Import | Path | Explanation |
| --- | --- | --- |
| Everything from `./database` | `src/infrastructure/database/index.ts` | Re-exports the mongoose connection (`MongoConnection`) and all Mongoose models (`UserModel`, `UserDocument`). Inductively pulls in `mongoose`, `../config`, `../shared/utils/logger`, and the seed module. |
| Everything from `./repositories` | `src/infrastructure/repositories/index.ts` | Re-exports `UserRepository`. Inductively pulls in `inversify`, `mongoose` (for `Types`), the user model, and several domain contracts. |
| Everything from `./di` | `src/infrastructure/di/index.ts` | Re-exports the Inversify `container`. Inductively pulls in `inversify`, `TYPES`, the repository, and all application use-case handlers. |

The evaluation order of the re-export statements matters: `./database` is evaluated first, then `./repositories`, then `./di`. The `di` container references `../repositories/user.repository`, which relies on the `database` models being registered, so this ordering satisfies the dependency chain.

# Exports
This file uses `export *` glob re-exports, so the exact set of exports is the union of the three sub-modules:
- From `./database`: `MongoConnection` (class), `UserModel` (const), and the type `UserDocument`.
- From `./repositories`: `UserRepository` (class).
- From `./di`: `container` (const, an Inversify `Container` instance).

The file itself does **not** declare any new named exports, classes, types, constants, or symbols.

# Internal Functions
None. This is a pure barrel file with no declarations.

# Execution Flow
1. Module load begins.
2. The runtime evaluates `export * from './database'`, which recursively loads `src/infrastructure/database/index.ts` (and everything it re-exports) and registers all of its named exports on this module's export object.
3. The runtime evaluates `export * from './repositories'`, loading `src/infrastructure/repositories/index.ts` and registering its named exports.
4. The runtime evaluates `export * from './di'`, loading `src/infrastructure/di/index.ts` and registering `container`.
5. Module load completes; consumers may now import anything from the infrastructure layer via this single file.

# Related Files
- `src/infrastructure/database/index.ts` — child barrel for database-related infrastructure.
- `src/infrastructure/repositories/index.ts` — child barrel for persistence implementations.
- `src/infrastructure/di/index.ts` — child barrel for the DI container.
- `src/infrastructure/database/models/index.ts`, `src/infrastructure/database/mongoose/index.ts`, `src/infrastructure/database/seed/index.ts` — deeper barrels re-exported transitively.

# Example Usage
```ts
// Server bootstrap / composition root
import {
  MongoConnection,
  UserRepository,
  container,
  UserModel,
  UserDocument,
} from './infrastructure';

// Resolve the repository from the shared container
const userRepository = container.get<IUserRepository>(TYPES.UserRepository);

// Start the database connection
await MongoConnection.getInstance().connect();

// Use the model directly when needed
const allUsers = await UserModel.find({}).lean();
```

# Best Practices
- Keep this barrel minimal and stable; treat its contents as the layer's official public API.
- Add any new infrastructure sub-module here so the rest of the app always imports from `infrastructure` rather than deep paths.
- Maintain a consistent child-barrel pattern (each directory has its own `index.ts`) so this root barrel stays trivial to read.
- Do not put logic in barrel files; they should only aggregate and re-export.

# Common Mistakes
- Importing deep paths such as `../infrastructure/database/models/user.model` directly from other layers instead of going through this barrel, which couples consumers to internal structure.
- Adding a new export in a child module but forgetting to re-export it here, causing consumers to miss the symbol.
- Introducing a named export at the top of this file that accidentally shadows one of the glob `export *` names.

# Notes For Frontend Developers
- You will almost never import from the infrastructure layer directly; the server (backend) abstracts it behind repositories and the DI container. The frontend consumes the HTTP API, not these classes.
- `UserModel` and `UserDocument` reflect the persisted data shape — the `email`, `name`, `role`, and `isActive` fields map directly to JSON fields you will see in API responses (role values are `ADMIN` / `MANAGER` / `STAFF`).
- `createdAt` / `updatedAt` timestamps are auto-managed by Mongoose and returned as quoted ISO-8601 date strings in JSON; parse them with `new Date()`.
- The `id` you see in API payloads corresponds to `_id` (a Mongo ObjectId string) on this side.

---

## Function: (none)

This barrel file defines no functions or methods.
