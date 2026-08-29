# File Name
`logger.ts`

# File Path
`src/shared/utils/logger.ts`

# Purpose
Configures and exports the application-wide Winston `logger` instance. It selects format and transports based on the environment: structured JSON logging to console plus file transports in production, and human-readable colorized console output in development. It also sets a default service metadata tag (`twk-admin-api`).

# Responsibilities
- Create and export the shared `logger` (Winston) instance with configured level.
- Build a production JSON `logFormat` (timestamp + stack + JSON).
- Build a development human-readable `devFormat` (short timestamp, colorization, stack printing).
- Configure transports: Console always; file transports (`error.log`, `combined.log`) only in production.
- Set the log level from config and default metadata `{ service: 'twk-admin-api' }`.

# Dependencies
- `winston` — `createLogger`, `format.combine/timestamp/errors/json/colorize/printf`, `transports.Console/File`.
- `../../config` — `config.nodeEnv`, `config.logLevel` used for environment/level selection.

# Exports
- `logger` — the configured Winston logger instance.
- (Internal) `logFormat`, `devFormat`, `transports` — module-local format definitions and transport array (not exported).

## Function: logger (constant / Winston logger instance)
- Location: `src/shared/utils/logger.ts:31`
- Purpose: The shared logger used across the application for structured, environment-aware logging.
- Parameters: None (instance created at module load).
- Return Type: Winston `Logger` instance.
- Throws: Nothing at creation (writes are handled by Winston transports).
- Called By: `requestLogger` middleware, `errorHandler` middleware, and any other module logging via `logger.error/info/warn/debug`.
- Calls:
  - `winston.createLogger({ level, format, transports, defaultMeta })` with:
    - `level: config.logLevel`
    - `format`: `logFormat` in production, else `devFormat`
    - `transports`: the configured transport array
    - `defaultMeta: { service: 'twk-admin-api' }`
- Execution Flow:
  1. Define `logFormat`: combine `timestamp('YYYY-MM-DD HH:mm:ss')`, `errors({ stack: true })`, `json()`.
  2. Define `devFormat`: combine `timestamp('HH:mm:ss')`, `colorize()`, and a `printf` that prints `timestamp level: message` plus `\n stack` when a stack is present.
  3. Build `transports` = `[new winston.transports.Console()]`.
  4. If `config.nodeEnv === 'production'`, append `File({ filename: 'logs/error.log', level: 'error' })` and `File({ filename: 'logs/combined.log' })`.
  5. Call `winston.createLogger(...)` and export as `logger`.
- Example Input: `logger.info('Request completed', { method: 'GET', statusCode: 200 })`.
- Example Output (dev console): `12:34:56 info: Request completed {"method":"GET","statusCode":200}` (colorized; object serialized by the console transport).
- Example Output (production file): `{"service":"twk-admin-api","level":"info","message":"Request completed","timestamp":"2026-08-27 12:34:56","method":"GET","statusCode":200}` (JSON).
- Business Logic: Centralizes log formatting/transport so all modules log consistently; production adds durable file output, development gives readable output.
- Edge Cases:
  - In development, `errors({ stack: true })` is not applied, but `printf` reads a `stack` property if present (from Winston's error handling) and prints it on a new line.
  - File directories (`logs/`) must exist/writable in production; Winston may error if it cannot open the file.
  - `config.logLevel` must be a valid Winston level (from `error|warn|info|debug`).
- Notes: `logger` methods (`info`, `warn`, `error`, `debug`) are available after import.

## Function: logFormat (module-internal formatter)
- Location: `src/shared/utils/logger.ts:4`
- Purpose: Production JSON log format combining a full timestamp, error stack capture, and JSON serialization.
- Parameters: None (a Winston `Format`).
- Return Type: Winston `Format`.
- Throws: Nothing.
- Called By: Assigned to the logger's `format` in production.
- Calls: `winston.format.combine`, `timestamp`, `errors`, `json`.
- Execution Flow: Combines timestamp, error-stack inclusion, and JSON output.
- Example Input: A log entry object.
- Example Output: JSON record with `timestamp`, `level`, `message`, `stack` (for errors), and custom fields.
- Business Logic: Structured, machine-readable logs for production aggregation.
- Edge Cases: `errors({ stack: true })` attaches stack only when message is an Error.
- Notes: Internal constant, not exported.

## Function: devFormat (module-internal formatter)
- Location: `src/shared/utils/logger.ts:10`
- Purpose: Development console format: short timestamp, colorization, and simple printf output including stack when present.
- Parameters: None (a Winston `Format`).
- Return Type: Winston `Format`.
- Throws: Nothing.
- Called By: Assigned to the logger's `format` in non-production.
- Calls: `winston.format.combine`, `timestamp`, `colorize`, `printf`.
- Execution Flow: Combines timestamp, colorization, and a `printf` that formats `timestamp level: message` with an optional `\n stack` line.
- Example Input: `{ timestamp, level, message, stack }`.
- Example Output: e.g. `12:34:56 info: User created` or `12:34:56 error: boom\n<stack trace>`.
- Business Logic: Readable logs for local development.
- Edge Cases: If `stack` is falsy, only the single-line message is printed.
- Notes: Internal constant, not exported.

## Function: transports (module-internal array)
- Location: `src/shared/utils/logger.ts:20`
- Purpose: Holds the transport list (console always; files added in production).
- Parameters: None.
- Return Type: `winston.transport[]`.
- Throws: Nothing.
- Called By: Passed to `winston.createLogger`.
- Calls: `new winston.transports.Console()`, `new winston.transports.File(...)`.
- Execution Flow: Start with Console; append `logs/error.log` (error level) and `logs/combined.log` when nodeEnv is production.
- Example Input: N/A.
- Example Output: Array of one Console transport (dev) or Console + two File transports (production).
- Business Logic: Durable file logging only in production; console everywhere.
- Edge Cases: File paths are relative to the app working directory.
- Notes: Internal constant, not exported.

# Internal Functions
- `logFormat`, `devFormat`, and `transports` are module-internal constants (documented above).

# Execution Flow
1. Module load builds the two formats and the transport list based on `config.nodeEnv`.
2. `winston.createLogger` produces the `logger` instance.
3. `logger` is exported and used by middleware and services.

# Related Files
- `src/shared/utils/index.ts` (note: `logger` is imported directly by middleware, not re-exported in the utils barrel)
- `src/shared/middleware/request-logger.middleware.ts`
- `src/shared/middleware/error-handler.middleware.ts`
- `src/config/index.ts`

# Example Usage
```ts
import { logger } from '../../shared/utils/logger';

logger.info('User created', { userId });
logger.error('Something failed', { error: err.message, stack: err.stack });
logger.warn('Deprecated call', { url: req.url });
```

# Best Practices
- Import `logger` from `../utils/logger` directly (it is not re-exported in the `utils` barrel).
- Use structured objects as the second argument for searchable logs.
- Use `logger.error` for errors and 5xx, `logger.warn` for 4xx, `logger.info` for normal events.

# Common Mistakes
- Expecting `logger` to be exported from the utils barrel (it isn't — import from `utils/logger`).
- Passing only a string with no structured context, reducing log usefulness.
- Relying on non-production formats in deployed environments.

# Notes For Frontend Developers
`logger` is server-only. However, its severity mapping (`error` for 5xx, `warn` for 4xx, `info` otherwise) is the same convention the request logger uses — useful context when correlating client-visible status codes with server log entries.
