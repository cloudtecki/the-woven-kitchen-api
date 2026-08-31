# File Name
`server.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\server.js`

# Purpose
The application entry point (bootstrap). It connects to MongoDB, starts the HTTP server by calling `app.listen(config.port)`, and registers graceful-shutdown handlers for `SIGINT`/`SIGTERM`. Plain JavaScript (CommonJS — `require` / `module.exports`). There is no build step; this file runs directly with `node`.

# Responsibilities
- Connect to MongoDB via `connectDB()` before listening.
- Start the Express HTTP server on `config.port` and log the running URL, Swagger URL, and environment.
- Define and register a `shutdown` routine that closes the server, disconnects the DB, and exits cleanly, with a 10-second forced-exit timeout safety net.
- Register `SIGINT` and `SIGTERM` handlers to trigger graceful shutdown.
- Export nothing meaningful (it self-runs via `start()` at module load).

# Exports
- None. It runs `start()` at module load. (No `module.exports` statement; CommonJS still exposes an empty object.)

# Internal Functions
- `start()` — async bootstrap that connects the DB and starts listening.
- `shutdown(signal)` — graceful-shutdown routine.
- `server` — module-scoped variable holding the HTTP server instance for shutdown.

## Function: start
- Location: `src/server.js:10`
- Purpose: Connects the database and starts the HTTP server; on failure logs and exits with code 1.
- Parameters: None.
- Return: `Promise<void>`.
- Throws: Does not throw; on DB connect or listen failure, logs and calls `process.exit(1)`.
- Called By: Module-level invocation `start();` at `src/server.js:45`.
- Calls: `connectDB()`, `app.listen(config.port, cb)`, `logger.info`, `logger.error`, `process.exit`.
- Execution Flow:
  1. `await connectDB()`.
  2. `server = app.listen(config.port, cb)`; in the callback, log the port, environment, and Swagger URL.
  3. On error, log and `process.exit(1)`.
- Example Input: None.
- Example Output: Logs `API running on port <port> (<env>)` and `Swagger docs: http://localhost:<port>/api-docs`.
- Business Logic: Enforces DB-before-listen sequencing so the server never reports readiness while the DB is unavailable.
- Edge Cases: DB connection failure → logs and `process.exit(1)`, so `app.listen` is never reached.

## Function: shutdown
- Location: `src/server.js:23`
- Purpose: Gracefully closes the HTTP server, disconnects the DB, and exits; includes a 10-second forced-exit timeout as a safety net.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `signal` | `string` | Yes | The OS signal that triggered shutdown (e.g. `'SIGTERM'`, `'SIGINT'`), used only for logging. |
- Return: `Promise<void>`.
- Throws: Does not throw; the timeout forces exit.
- Called By: `process.on('SIGINT', ...)` / `process.on('SIGTERM', ...)` handlers at `src/server.js:42-43`.
- Calls: `logger.info`, `logger.error`, `server.close(cb)`, `disconnectDB()`, `process.exit`, `setTimeout`.
- Execution Flow:
  1. Log the received signal.
  2. If a server exists: set a 10-second timeout that logs and `process.exit(1)`.
  3. Call `server.close(async () => { await disconnectDB(); logger.info('Server closed'); process.exit(0); })`.
  4. If no server, `process.exit(0)`.
- Example Input: `'SIGINT'`.
- Example Output: Logs shutdown steps; process exits `0` (or `1` on forced timeout).
- Business Logic: Drains in-flight HTTP connections and releases the DB cleanly within a bounded window.
- Edge Cases: Connections keep `server.close` pending past 10s → forced exit `1`. Signal arrives before the server is assigned → exits `0` immediately.

# Execution Flow
1. `start()` connects the DB, then listens on `config.port`.
2. `SIGINT`/`SIGTERM` handlers call `shutdown`.
3. `shutdown` closes the server, disconnects DB, and exits cleanly (with a 10s timeout fallback).

# Related Files
- `src/app.js` — the app instance that is started.
- `src/config/index.js` — provides `config` (`port`, `nodeEnv`).
- `src/shared/utils/logger.js` — provides `logger`.
- `src/infrastructure/database/mongoose/connection.js` — provides `connectDB`, `disconnectDB`.

# Example Usage
```bash
# Run directly with node (no build step)
node src/server.js
```

# Best Practices
- Keep the entry point thin: delegate app construction to `app.js` and DB concerns to the connection module.
- Connect before listening so the server does not claim readiness while the DB is unavailable.
- Always include a forced-shutdown timeout so graceful shutdown cannot hang forever.

# Common Mistakes
- Calling `app.listen` before DB connection, causing requests to fail at startup.
- Omitting the forced-shutdown timeout, leaving the process hung during shutdown.
- Putting `app.listen` in `app.js`, coupling app construction with server lifecycle.

# Notes For Frontend Developers
- Not part of the HTTP API surface; it is the process launcher.
- After startup the port, environment, and Swagger URL are logged.
- `Ctrl+C` (`SIGINT`) triggers a clean shutdown that closes HTTP connections and the DB.
- The server fails to start (exit 1) if MongoDB is unreachable or env vars are misconfigured.
