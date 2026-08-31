# File Name
`connection.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\infrastructure\database\mongoose\connection.js`

# Purpose
Establishes and tears down the MongoDB connection using Mongoose. It wires connection lifecycle event listeners (connected/error/disconnected) for logging and exposes `connectDB` and `disconnectDB`. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Set Mongoose `strictQuery` to `true`.
- Register connection lifecycle event listeners for logging.
- Connect to MongoDB with `config.mongoUri` and `config.dbName`; disable auto-indexing in production (`autoIndex: !isProd`).
- Disconnect when shutting down.

# Exports
- `connectDB` — async function; opens the Mongoose connection.
- `disconnectDB` — async function; closes the Mongoose connection.

## Function: connectDB
- Location: `src/infrastructure/database/mongoose/connection.js:9`
- Purpose: Register lifecycle listeners and open the Mongoose connection.
- Parameters: None.
- Return: `Promise<void>`.
- Throws: Propagates connection errors to the caller (handled by `server.js`).
- Called By: `src/server.js` `start()`.
- Calls: `mongoose.connection.on(...)`, `logger.info/warn/error`, `mongoose.connect(config.mongoUri, { dbName, autoIndex: !isProd })`.
- Execution Flow:
  1. Attach `connected`/`error`/`disconnected` listeners that log.
  2. `await mongoose.connect(config.mongoUri, { dbName: config.dbName, autoIndex: !isProd })`.
- Example Input: None.
- Example Output: On connect, logs `MongoDB connected to database: <dbName>`; resolves.
- Business Logic: Centralizes Mongo wiring and config (`dbName`, auto-index control in prod).
- Edge Cases: Connection failures propagate to be caught by `server.js` for a clean exit.

## Function: disconnectDB
- Location: `src/infrastructure/database/mongoose/connection.js:28`
- Purpose: Close the Mongoose connection.
- Parameters: None.
- Return: `Promise<void>`.
- Throws: Propagates disconnect errors.
- Called By: `src/server.js` `shutdown()`.
- Calls: `mongoose.disconnect()`.
- Execution Flow: `await mongoose.disconnect()`.
- Example Input: None.
- Example Output: Resolves after the connection closes.

# Internal Functions
- None beyond the two exported functions.

# Execution Flow
- `server.js` calls `connectDB()` before listening and `disconnectDB()` during shutdown.

# Related Files
- `src/config/index.js` — provides `config.mongoUri`, `config.dbName`, `isProd`.
- `src/shared/utils/logger.js` — provides `logger`.
- `src/server.js` — consumer of `connectDB`/`disconnectDB`.
- `src/infrastructure/database/models` (empty scaffolding) — future Mongoose models needing this connection.

# Example Usage
```javascript
const { connectDB, disconnectDB } = require('./infrastructure/database/mongoose/connection');
await connectDB();
// ... work ...
await disconnectDB();
```

# Best Practices
- Always connect before serving requests and disconnect on shutdown.
- Disable auto-indexing in production to avoid index churn.

# Common Mistakes
- Calling `mongoose.connect` directly in multiple places rather than through this module.
- Enabling auto-indexing in production.

# Notes For Frontend Developers
- Not part of the HTTP API surface; it only manages the database lifecycle.
