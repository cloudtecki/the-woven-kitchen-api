# File Name
`index.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\config\index.js`

# Purpose
Loads and validates environment configuration using `dotenv` and a Zod schema. It exports a normalized `config` object plus an `isProd` boolean. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Load `.env` variables into `process.env` via `dotenv.config()`.
- Define a Zod `configSchema` describing required/optional environment variables and their defaults.
- Validate `process.env` against the schema with `safeParse`.
- On validation failure, print the issues and exit the process with code 1.
- Expose a camelCased `config` object and an `isProd` helper.

# Exports
- `config` — object with `nodeEnv`, `port`, `mongoUri`, `dbName`, `apiPrefix`, `logLevel`.
- `isProd` — boolean, `true` when `nodeEnv === 'production'`.

# Internal Functions
- None. Validation runs at module load; `config` and `isProd` are computed as module constants.

# Execution Flow
1. `dotenv.config()` loads `.env`.
2. `configSchema.safeParse(process.env)` validates the environment.
3. If invalid, each issue is logged and `process.exit(1)` is called.
4. `config` is built from `parsed.data` (values already coerced/validated by Zod).
5. `isProd` is derived and both are exported.

# Related Files
- `src/app.js` — reads `config.apiPrefix`, `isProd`.
- `src/server.js` — reads `config.port`, `config.nodeEnv`.
- `src/config/swagger.js` — reads `config.port`.
- `src/infrastructure/database/mongoose/connection.js` — reads `config.mongoUri`, `config.dbName`, `isProd`.
- `src/shared/utils/logger.js` — reads `config.logLevel`, `config.nodeEnv`.

# Example Usage
```javascript
const { config, isProd } = require('../config');
console.log(config.port, config.apiPrefix, isProd);
```

# Schema Summary
- `NODE_ENV` — enum `['development','production','test']`, default `development`.
- `PORT` — integer 1–65535, default `3000` (coerced from string).
- `MONGODB_URI` — required non-empty string.
- `DB_NAME` — string, default `thewovencloudkitchen`.
- `API_PREFIX` — string, default `/api`.
- `LOG_LEVEL` — enum `['error','warn','info','debug']`, default `info`.

# Best Practices
- Keep all environment parsing/validation in one place so misconfiguration fails fast at startup.
- Document required vars (like `MONGODB_URI`) so deployment config is explicit.

# Common Mistakes
- Forgetting to set `MONGODB_URI`, causing a startup crash with a Zod validation error.
- Reading `process.env` directly elsewhere instead of using the validated `config` object.

# Notes For Frontend Developers
- The API prefix defaults to `/api` (override via `API_PREFIX`), and the port defaults to `3000` (override via `PORT`).
- `MONGODB_URI` is the environment-specific database connection string; without it the server exits immediately.
