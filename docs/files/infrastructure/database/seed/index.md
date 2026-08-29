# seed/index.ts

# File Path
`src/infrastructure/database/seed/index.ts`

# Purpose
This file is the **entry point (script runner)** for the database seeding process. When executed directly (typically via a build/run script such as `ts-node` / compiled output), it connects to MongoDB, instantiates the `DatabaseSeeder` with the repository resolved from the DI container, runs the seed using configuration derived from environment variables, and cleanly disconnects before exiting the process.

It demonstrates composition at the infrastructure edge: it wires together the connection, the DI container, the repository, and the seeder, then delegates to `DatabaseSeeder.run()`. It is **not** re-exported by the `database/index.ts` barrel because it is a standalone script rather than part of the server's public API.

# Responsibilities
- Import side effects (`reflect-metadata`) required for Inversify decorators/DI to function.
- Build the `SeedConfig` from environment variables with sensible defaults.
- Ensure a runnable entry chain: connect → build seeder → run → log → disconnect → exit(0).
- Handle failures: log the error → disconnect → exit(1).
- Terminate the Node process deterministically after completion via `process.exit`.
- Programmatically terminate the process on failure so a non-zero exit code is guaranteed for CI.

# Dependencies

| Import | Path | Explanation |
| --- | --- | --- |
| `reflect-metadata` (side effect) | `reflect-metadata` | Required for decorator metadata emission used by Inversify's `@injectable`/`@inject`. |
| `MongoConnection` | `../mongoose/connection` | The singleton connection manager; used to connect and disconnect. |
| `container` | `../../di/container` | The Inversify DI container used to resolve the user repository. |
| `TYPES` | `../../../shared/constants/tokens` | Symbol keys (`TYPES.UserRepository`) used to resolve/identify bindings. |
| `DatabaseSeeder`, `SeedConfig` | `./seeder` | The seeder class and its configuration type. |
| `IUserRepository` | `../../../domain/repositories/user-repository.interface` | Interface type used to type the resolved repository (`container.get<IUserRepository>`). |
| `logger` | `../../../shared/utils/logger` | Winston logger for `info`/`error` messages. |

# Exports
This file declares **no named exports** for API consumption. It is an entry script whose top-level `main()` is called immediately (IIFE) on load. Neither `main` nor `seedConfig` is exported.

# Internal Functions
- `main()` — the async bootstrap function that runs the whole seeding process (documented below).
- The top-level `.catch()` handler attached to `main()` (behavior documented within `main`).

# Execution Flow
1. Load `reflect-metadata` so Inversify decorators emit metadata.
2. Construct `seedConfig`:
   - `adminEmail` = `process.env.SEED_ADMIN_EMAIL` lowercased, or the default `'admin@thewovencloudkitchen.com'`.
   - `adminName` = `process.env.SEED_ADMIN_NAME`, or `'System Administrator'`.
3. Call `main()`:
   - `await MongoConnection.getInstance().connect()`.
   - `container.get<IUserRepository>(TYPES.UserRepository)` to obtain the singleton repository.
   - `new DatabaseSeeder(repository)` constructed.
   - `await seeder.run(seedConfig)`.
   - Log `Seeding completed`.
   - `await MongoConnection.getInstance().disconnect()`.
   - `process.exit(0)`.
4. If `main()` rejects, the `.catch`:
   - Logs `Seeding failed` with the error message.
   - `await MongoConnection.getInstance().disconnect()`.
   - `process.exit(1)`.

# Related Files
- `src/infrastructure/database/seed/seeder.ts` — the `DatabaseSeeder` implementation invoked here.
- `src/infrastructure/database/mongoose/connection.ts` — connection lifecycle used here.
- `src/infrastructure/di/container.ts` — the DI container that resolves `TYPES.UserRepository`.
- `src/shared/constants/tokens.ts` — the `TYPES.UserRepository` symbol.
- `src/domain/repositories/user-repository.interface.ts` — the resolved repository's contract.
- `src/config/index.ts` — indirectly provides connection configuration used by `MongoConnection`.

# Example Usage
This is a script, executed directly, not imported:
```bash
# Using environment variables (optional)
SEED_ADMIN_EMAIL=root@example.com SEED_ADMIN_NAME="Root Admin" npm run seed
# or simply
npm run seed
```
It produces log output like:
```
info: MongoDB connected to database: thewovencloudkitchen
info: Seeded admin user: admin@thewovencloudkitchen.com
info: Seeding completed
```

# Best Practices
- Run seeding in a controlled environment (local/CI or a dedicated migration job), not as part of normal server startup middleware.
- Use `SEED_ADMIN_*` environment variables to customize the admin identity without code changes.
- Invoke `disconnect()` before `process.exit()` in both success and error paths to close the connection pool cleanly.
- Keep the seeder idempotent (see `DatabaseSeeder.seedAdmin`) so re-running does not duplicate the admin user.

# Common Mistakes
- Forgetting `reflect-metadata` import — Inversify decorators would fail at runtime without metadata.
- Running seed as part of application startup, which would seed on every boot in production.
- Not lowercasing the admin email before comparison/lookup, which can cause the idempotency check to miss and create duplicates (this file lowercases via `.toLowerCase()`).
- Relying on the process to exit on its own instead of calling `process.exit`, risking a hang on an open connection.

# Notes For Frontend Developers
- The seeding process guarantees that a default admin account exists at `admin@thewovencloudkitchen.com` (or the configured `SEED_ADMIN_EMAIL`) — useful to know for initial login/testing.
- The seeded admin has role `ADMIN`, so it can access all admin-only UI routes in the frontend.
- Changing the default admin credentials only affects fresh databases; existing seeded admins remain unless manually removed.

---

## Function: main

- Location: `src/infrastructure/database/seed/index.ts:14`
- Purpose: The async bootstrap routine that connects to MongoDB, resolves the repository, runs the `DatabaseSeeder`, logs completion, disconnects, and exits with code 0. It is invoked immediately when the module loads.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| *(none)* | — | — | Takes no arguments; reads `seedConfig` (module scope) and the DI container. |

- Return Type: `Promise<void>`. The function never returns normally to callers because it calls `process.exit(0)` on success.
- Throws: Rejects asynchronously on failure (handled by the top-level `.catch` handler).
- Called By: Direct invocation at module load: `main().catch(...)`.
- Calls:
  - `MongoConnection.getInstance().connect()`
  - `container.get<IUserRepository>(TYPES.UserRepository)`
  - `new DatabaseSeeder(repo)`
  - `seeder.run(seedConfig)`
  - `logger.info('Seeding completed')`
  - `MongoConnection.getInstance().disconnect()`
  - `process.exit(0)`
- Execution Flow:
  1. Connect to MongoDB via the singleton connection.
  2. Resolve `IUserRepository` from the container using `TYPES.UserRepository`.
  3. Construct `DatabaseSeeder` with the repository.
  4. Await `seeder.run(seedConfig)` (which syncs indexes and seeds the admin).
  5. Log `Seeding completed`.
  6. Disconnect from MongoDB.
  7. `process.exit(0)`.
- Example Input: (none — module is executed)
- Example Output: No return value; process exits with status `0`. Logs indicate success.
- Business Logic: Wires the infrastructure together and drives a one-shot seed run to completion before terminating.
- Edge Cases:
  - If MongoDB is unreachable, `await connect()` rejects → `main` rejects → `.catch` logs `Seeding failed`, disconnects, and exits with `1`.
  - If `seeder.run` rejects (e.g. index sync), the same error pathway applies.
- Notes: Because `process.exit` is called, awaiting `main()` never resolves in the success case.
