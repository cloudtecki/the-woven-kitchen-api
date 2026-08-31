# File Name
`logger.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\shared\utils\logger.js`

# Purpose
Creates and exports a Winston logger used across the application. It selects a JSON format in production and a human-readable, colorized dev format otherwise, with a configurable log level. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Configure Winston with a timestamped format (JSON in production, colorized console in development).
- Include stack traces in log output where available.
- Apply the `service: 'twk-admin-api'` default metadata.
- Use `config.logLevel` as the log threshold.

# Exports
- `logger` — a configured Winston logger instance.

# Internal Functions
- `logFormat` — module-scoped JSON format (timestamp, errors/stack, json).
- `devFormat` — module-scoped dev format (timestamp HH:mm:ss, colorize, printf).

# Execution Flow
- At module load, builds `logFormat`/`devFormat`, then creates the `logger` with the chosen format and a Console transport; imports elsewhere receive the ready `logger`.

# Related Files
- `src/config/index.js` — provides `config.logLevel` and `config.nodeEnv` (used to pick format).
- Consumers: `src/server.js`, `src/app.js` (indirectly), `src/api/middlewares/*`, `src/infrastructure/database/mongoose/connection.js`.

# Example Usage
```javascript
const { logger } = require('../shared/utils/logger');
logger.info('Request completed', { method: 'GET', url: '/api/health' });
logger.error('Failed', { error: 'boom', stack: new Error('boom').stack });
```

# Best Practices
- Always attach a second `object` argument for structured metadata to aid debugging.
- Log errors with `error`/`warn` levels so they surface appropriately in monitoring.

# Common Mistakes
- Logging without metadata, making logs hard to search.
- Hard-coding a log level instead of using `config.logLevel`.

# Notes For Frontend Developers
- Not part of the HTTP API surface; it controls how the server logs internally (dev console vs production JSON).
