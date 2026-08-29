# connection.ts

# File Path
`src/infrastructure/database/mongoose/connection.ts`

# Purpose
This file implements the `MongoConnection` class, a **thread-safe, lazily-initialized singleton** that manages the application's single Mongoose/MongoDB connection lifecycle. It centralizes connection configuration (database name, auto-index behavior), event-driven logging (connected / error / disconnected), and provides idempotent `connect()` and `disconnect()` methods used by both the server bootstrap and the standalone seeding script.

It also contains a small private helper, `isProd()`, which decides whether automatic index building (`autoIndex`) is enabled based on the runtime environment.

# Responsibilities
- Expose a singleton instance via `getInstance()` (lazy initialization with a private constructor to prevent direct instantiation).
- Configure Mongoose runtime behavior (e.g. `strictQuery = true`).
- Register lifecycle event listeners for logging: `connected`, `error`, `disconnected`.
- Establish the actual connection via `mongoose.connect` using `config.mongoUri` and `config.dbName`.
- Control `autoIndex`: disabled in production, enabled otherwise.
- Report and rethrow connection failures.
- Provide a clean `disconnect()` that closes the underlying connection.
- Keep environment-sensitive behavior (production detection) isolated in the private `isProd()` helper.

# Dependencies

| Import | Path | Explanation |
| --- | --- | --- |
| `mongoose` (default import) | `mongoose` | The ODM library providing `connect`, `disconnect`, `set`, and the connection lifecycle event emitter. |
| `config` | `../../../config` | Loaded, validated environment configuration; provides `mongoUri`, `dbName`, and `nodeEnv`. |
| `logger` | `../../../shared/utils/logger` | Winston-based structured logger used for lifecycle messages (`info`, `warn`, `error`). |

# Exports
- `MongoConnection` — the exported ES class (a singleton connection manager).

The file has no other named exports. `isProd()` is a module-private function and is **not** exported.

# Internal Functions
- `isProd()` — module-private helper (documented below).
- `MongoConnection` — class with private constructor, `getInstance` static factory, `connect()`, `disconnect()` methods (each documented below as a method Function section).

# Execution Flow
1. `MongoConnection.getInstance()` returns the one shared instance (creating it on first call).
2. A consumer calls `connect()`:
   - Mongoose `strictQuery` is set to `true`.
   - Lifecycle listeners are attached for `connected`, `error`, `disconnected` logging.
   - `mongoose.connect(config.mongoUri, { dbName, autoIndex: !isProd() })` is awaited inside a try/catch.
   - On failure, the error is logged and rethrown.
3. While connected, Mongoose emits events; listeners log them.
4. On shutdown, a consumer calls `disconnect()`, which awaits `mongoose.disconnect()` and closes the connection pool.

# Related Files
- `src/infrastructure/database/mongoose/index.ts` — barrel that re-exports `MongoConnection`.
- `src/infrastructure/database/index.ts` — parent barrel forwarding `MongoConnection`.
- `src/config/index.ts` — source of `config.mongoUri`, `config.dbName`, `config.nodeEnv`.
- `src/shared/utils/logger.ts` — the logger used for all lifecycle messages.
- `src/infrastructure/database/models/user.model.ts` — models bound to this connection.
- `src/infrastructure/database/seed/index.ts` and `#/seeder.ts` — consumers that call `connect()`/`disconnect()` directly.

# Example Usage
```ts
import { MongoConnection } from './infrastructure/database/mongoose';

async function bootstrap() {
  const conn = MongoConnection.getInstance();
  await conn.connect();
  // ... run application ...

  await conn.disconnect(); // graceful shutdown
}
```

# Best Practices
- Use the singleton via `MongoConnection.getInstance()` everywhere instead of `new MongoConnection()` (the constructor is private to enforce this).
- Keep all connection tuning (dbName, autoIndex) config-driven through `config`, not hardcoded.
- Disable `autoIndex` in production to avoid index churn on high-traffic deployments; run `syncIndexes`/migrations separately.
- Always call `disconnect()` on shutdown or on script completion to release the connection pool and avoid hanging process exit.

# Common Mistakes
- Calling `new MongoConnection()` directly — it throws because the constructor is private; always use `getInstance()`.
- Relying on auto-indexing in production where `autoIndex` defaults to disabled, causing lookups to miss indexes.
- Forgetting to `disconnect()` in scripts, which can leave the Node process alive waiting on the open connection.
- Wrapping `mongoose.connect` without rethrowing, silently hiding initialization failures — this file correctly rethrows.

# Notes For Frontend Developers
- The frontend does not interact with this class; connection lifecycle is an internal server concern.
- `autoIndex` behavior means database index creation is a backend/deployment concern: verify indexes exist in production, or user lookups by `email`/`_id` may slow down.

---

## Function: getInstance

- Location: `src/infrastructure/database/mongoose/connection.ts:10`
- Purpose: Returns the single shared `MongoConnection` instance, creating it lazily on first invocation. Enforces the singleton pattern.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| *(none)* | — | — | Takes no arguments. |

- Return Type: `MongoConnection` (the singleton instance).
- Throws: Does not throw.
- Called By: External consumers such as server bootstrap and the seed script (`MongoConnection.getInstance().connect()`).
- Calls: `new MongoConnection()` — but only on the first call when `instance` is `null`.
- Execution Flow:
  1. Check the static `instance` field.
  2. If `null`, assign `this.instance = new MongoConnection()` (invokes the private constructor).
  3. Return `this.instance`.
- Example Input: `MongoConnection.getInstance()`
- Example Output: A `MongoConnection` instance (identical reference on subsequent calls).
- Business Logic: Guarantees exactly one connection manager for the process lifetime, preventing duplicate connection pools.
- Edge Cases:
  - Concurrent first calls from multiple async contexts could race; in practice, JS single-threaded execution plus synchronous assignment makes this effectively race-free.
- Notes: The constructor is private, so this static method is the **only** way to obtain an instance.

## Function: connect

- Location: `src/infrastructure/database/mongoose/connection.ts:17`
- Purpose: Establishes the MongoDB connection using config values, attaches lifecycle event logging, and honors the `autoIndex` setting.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| *(none)* | — | — | Takes no arguments; all configuration comes from `config`. |

- Return Type: `Promise<void>` — resolves once the connection (or connection attempt) finishes.
- Throws: Rethrows any connection error **after** logging it. Callers must catch.
- Called By: Server bootstrap and the seeding script main function.
- Calls:
  - `mongoose.set('strictQuery', true)`
  - `mongoose.connection.on(...)` (three listeners: `connected`, `error`, `disconnected`)
  - `mongoose.connect(config.mongoUri, { dbName, autoIndex })`
  - `isProd()` (to decide `autoIndex`)
  - `logger.info`, `logger.error`, `logger.warn`
- Execution Flow:
  1. Set `strictQuery` to `true`.
  2. Register an `on('connected')` listener that logs `MongoDB connected to database: ${config.dbName}`.
  3. Register an `on('error')` listener that logs the connection error message.
  4. Register an `on('disconnected')` listener that logs a warning.
  5. In try/catch, `await mongoose.connect(config.mongoUri, { dbName: config.dbName, autoIndex: !isProd() })`.
  6. On success, the promise resolves (the `connected` event may fire asynchronously later).
  7. On failure, log `Failed to connect to MongoDB` and rethrow.
- Example Input: `await MongoConnection.getInstance().connect();`
- Example Output: Resolves with `void`; logs `MongoDB connected to database: <dbName>` via the `connected` event.
- Business Logic: Centralizes and standardizes how and where Mongoose connects, and makes the environment-sensitive `autoIndex` decision.
- Edge Cases:
  - Connection error during `mongoose.connect` → logged and rethrown; the process/error handler should handle it.
  - Connection drops after the initial connect → handled by the `disconnected` / `error` listeners, logging only.
- Notes: `autoIndex` is `true` in non-production and `false` in production (see `isProd()`).

## Function: disconnect

- Location: `src/infrastructure/database/mongoose/connection.ts:43`
- Purpose: Cleanly closes the Mongoose connection, releasing the underlying MongoDB connection pool.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| *(none)* | — | — | Takes no arguments. |

- Return Type: `Promise<void>`.
- Throws: May reject if Mongoose fails to disconnect; typically not wrapped here.
- Called By: Server shutdown routines and the seed script (success and error paths).
- Calls: `mongoose.disconnect()`.
- Execution Flow:
  1. `await mongoose.disconnect()` is invoked.
  2. Mongoose closes the connection and resolves when done.
- Example Input: `await MongoConnection.getInstance().disconnect();`
- Example Output: Resolves with `void`; the connection is closed.
- Business Logic: Provides an idempotent-ish shutdown primitive; calling it on a closed connection is generally safe for Mongoose.
- Edge Cases: If already disconnected, Mongoose resolves without error; disconnecting while commands are in flight may reject.
- Notes: Always await this during graceful shutdown so Node can exit cleanly.

## Function: isProd

- Location: `src/infrastructure/database/mongoose/connection.ts:48`
- Purpose: Module-private helper determining whether the runtime is the production environment.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| *(none)* | — | — | Takes no arguments; reads `config.nodeEnv`. |

- Return Type: `boolean` — `true` when `config.nodeEnv === 'production'`.
- Throws: Does not throw.
- Called By: `connect()` (to compute the `autoIndex` option).
- Calls: Reads `config.nodeEnv`.
- Execution Flow:
  1. Read `config.nodeEnv`.
  2. Return whether it strictly equals `'production'`.
- Example Input: (none)
- Example Output: `false` in development/test, `true` in production.
- Business Logic: Centralizes the environment check so `autoIndex` is disabled precisely in production.
- Edge Cases: `nodeEnv` is validated by the config schema to be one of `development`/`production`/`test`, so no other values are possible.
- Notes: Not exported; internal implementation detail of this module.
