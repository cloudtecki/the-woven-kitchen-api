# File Name
server.ts

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\server.ts`

# Purpose
The application entry point (bootstrap). It wires up the database connection, starts the HTTP server by calling `app.listen`, registers graceful-shutdown handlers for OS signals, and handles unhandled promise rejections and uncaught exceptions. This is the file that actually launches the backend process.

# Responsibilities
- Import `reflect-metadata` as a side effect (required for dependency-injection decorators / metadata reflection used by the Inversify-style container).
- Establish the MongoDB connection via `MongoConnection.getInstance().connect()` before starting the server; on failure, log the error and exit the process.
- Start the Express HTTP server on the configured `PORT` and log the running URL, docs URL, and environment.
- Define and register a `gracefulShutdown` routine that closes the HTTP server, disconnects the database, and exits cleanly, with a 10-second forced-exit timeout safety net.
- Register handlers for `SIGTERM` and `SIGINT` signals to trigger graceful shutdown.
- Register process-level handlers for `unhandledRejection` (logged) and `uncaughtException` (logged then exit).
- Invoke `bootstrap()` at module load to start the application.
- Export `app` as the default export (so tooling/tests can import the app without side effects of listening).

# Dependencies
- `reflect-metadata` (side-effect import): Enables `Reflect.metadata` and decorator metadata support required by the dependency-injection container used transparently by the handlers.
- `./app` (named export `app`): The fully configured Express application instance, on which `.listen()` is called.
- `./config` (named export `config`): Provides `port`, `dbName`, and `nodeEnv` used for startup logging and server configuration.
- `./shared/utils/logger` (named export `logger`): Structured logging utility used for startup, error, and shutdown messages.
- `./infrastructure/database/mongoose/connection` (class `MongoConnection`): Singleton responsible for connecting to and disconnecting from MongoDB (`getInstance().connect()` / `disconnect()`).

# Exports
- `bootstrap` — not exported (module-private async function).
- `default` export: `app` — the Express application instance (re-exported for test/utility consumers).

# Internal Functions
- `bootstrap()` — async function that connects DB, starts the server, and registers signal handlers. See function section below.
- `gracefulShutdown(signal)` — module-private async closure defined inside `bootstrap`; closes server and DB then exits. See function section below.

# Execution Flow
1. Side-effect imports run (`reflect-metadata`, then the application modules).
2. `PORT` is read from `config.port`.
3. `bootstrap()` is invoked:
   - Connects MongoDB; logs success or logs error and `process.exit(1)` on failure.
   - Calls `app.listen(PORT, callback)` and logs startup info.
   - Defines and registers `gracefulShutdown` for `SIGTERM` and `SIGINT`.
4. Process-level `unhandledRejection` and `uncaughtException` handlers are registered (registered before `bootstrap()` is invoked).
5. On signal, `gracefulShutdown` closes the server, disconnects DB, and exits `0`; if this takes longer than 10 seconds, a timeout forces exit `1`.

# Related Files
- `src/app.ts` — provides the `app` instance that is started.
- `src/config/index.ts` — provides `port`, `dbName`, `nodeEnv`.
- `src/shared/utils/logger.ts` — provides the `logger` used for all output.
- `src/infrastructure/database/mongoose/connection.ts` — provides `MongoConnection` singleton used to connect/disconnect.

# Example Usage
```bash
# Start the server (runs bootstrap)
npm run start
# or
node dist/server.js
```
```typescript
// Programmatic import (no side effects of listening)
import app from './server';
// use `app` for supertest-style testing
```

# Best Practices
- Keep the entry point thin: delegate app construction to `app.ts` and DB infrastructure to `MongoConnection`.
- Connect to the database before listening so the server does not claim readiness while DB is unavailable.
- Always register graceful shutdown for signals and include a timeout safety net to avoid hanging forever.
- Register process-level error handlers to catch asynchronous failures that would otherwise crash silently.
- Use `reflect-metadata` as the very first import so decorator metadata is available before other modules load.

# Common Mistakes
- Starting `app.listen` before establishing the database connection, causing requests to fail at startup.
- Omitting the forced-shutdown timeout, leaving the process hanging during graceful shutdown.
- Not handling `unhandledRejection`, allowing the process to crash with an unhelpful stack trace.
- Calling `process.exit(1)` inside the DB connect catch and still attempting to start the server afterward.
- Importing `app.ts` in tests and inadvertently calling `bootstrap()` (in this design only `server.ts` calls `bootstrap`, so importing from `app.ts` avoids this).
- Blocking the event loop with synchronous work in `bootstrap`.

# Notes For Frontend Developers
- This file is not part of the HTTP API surface; it is the process launcher.
- After startup, the following are logged: the port, the Swagger docs URL (`http://localhost:<PORT>/api/docs`), and the node environment.
- Sending `SIGTERM`/`SIGINT` (e.g., `Ctrl+C`) triggers a clean shutdown that closes open HTTP connections and the database. On some platforms, delivering two signals or waiting >10 seconds forces an exit.
- The server will fail to start (exit code 1) if MongoDB is unreachable or environment variables are misconfigured — check the logs for the exact reason.

---

## Function: bootstrap
- Location: `src/server.ts:9`
- Purpose: Async bootstrap that connects to MongoDB, starts the HTTP server on the configured port, and registers graceful-shutdown signal handlers.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| (none) | — | — | This function takes no arguments. |

- Return Type: `Promise<void>`
- Throws: Does not throw; on DB connection failure it logs and calls `process.exit(1)`. Any other synchronous error would propagate, but the function catches DB connection errors specifically.
- Called By: Module-level invocation `bootstrap();` at `src/server.ts:55`.
- Calls:
  - `MongoConnection.getInstance().connect()`
  - `logger.info(...)` / `logger.error(...)`
  - `app.listen(PORT, callback)`
  - `process.on('SIGTERM', ...)` / `process.on('SIGINT', ...)`
  - `gracefulShutdown(signal)` (inner closure)
- Execution Flow:
  1. `await MongoConnection.getInstance().connect()`; on success log DB name, on failure log error and exit `1`.
  2. `const server = app.listen(PORT, cb)`; in the callback, log the port, docs URL, and environment.
  3. Define `gracefulShutdown` closure.
  4. Register `process.on('SIGTERM', ...)` and `process.on('SIGINT', ...)` to call `gracefulShutdown`.
- Example Input: None (invoked directly).
- Example Output: Returns `Promise<void>`; side effects are: DB connected, server listening, signal handlers registered.
- Business Logic: Coordinates startup sequencing (DB first, then HTTP) and registers lifecycle signal handling so the process can shut down cleanly.
- Edge Cases:
  - DB connection failure → logs and `process.exit(1)`, so the server never starts.
  - Signals received during shutdown → second call guarded by the timeout forcing exit `1`.
- Notes: `gracefulShutdown` is defined inside `bootstrap` so it closes over `server`.

## Function: gracefulShutdown
- Location: `src/server.ts:26` (defined within `bootstrap`)
- Purpose: Closes the HTTP server, disconnects the database, then exits the process; includes a 10-second forced-exit timeout as a safety net.
- Parameters:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `signal` | `string` | Yes | The OS signal that triggered shutdown (e.g., `'SIGTERM'`, `'SIGINT'`), used only for logging. |

- Return Type: `Promise<void>`
- Throws: Does not throw; errors are logged and the timeout forces exit.
- Called By: `process.on('SIGTERM', ...)` and `process.on('SIGINT', ...)` handlers registered in `bootstrap`.
- Calls:
  - `logger.info(...)` / `logger.error(...)`
  - `server.close(callback)` (Express/Node HTTP server)
  - `MongoConnection.getInstance().disconnect()`
  - `process.exit(0)` / `process.exit(1)`
  - `setTimeout(...)`
- Execution Flow:
  1. Log the received signal.
  2. Register a `setTimeout` for 10 seconds that logs an error and forces `process.exit(1)`.
  3. Call `server.close(callback)`; in the callback, log server closed, `await disconnect()`, log DB closed, then `process.exit(0)`.
- Example Input: `'SIGTERM'`.
- Example Output: Logs shutdown steps; process exits `0` (or `1` on timeout).
- Business Logic: Ensures in-flight HTTP connections are drained and the DB connection is cleanly released before termination, with a bounded shutdown window.
- Edge Cases:
  - Server has long-lived connections that keep `server.close` pending → 10-second timeout forces termination.
  - Signal arrives while already shutting down → timeout may fire and force exit `1`.
- Notes: `server.close` only stops accepting *new* connections; the avoidable risk of lingering connections is covered by the timeout.
