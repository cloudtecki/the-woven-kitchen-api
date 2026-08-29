# File Name
index.ts (config)

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\config\index.ts`

# Purpose
Centralized, validated environment configuration module. It loads environment variables with `dotenv`, defines a Zod schema that enforces types and required values, parses `process.env` against that schema, and exports typed, camelCase configuration plus derived development/production flags. Any invalid or missing configuration aborts the process at startup, guaranteeing the rest of the application runs against a validated config shape.

# Responsibilities
- Load `.env` variables into `process.env` via `dotenv.config()`.
- Define a Zod schema (`configSchema`) describing every expected environment variable with defaults, coercions, enums, and validation rules.
- Safely parse `process.env` with `configSchema.safeParse(...)`.
- On validation failure, print each issue clearly (path + message) and exit the process with code 1.
- Export a typed `config` object with normalized camelCase keys for `port`, `nodeEnv`, `mongoUri`, `dbName`, `jwtSecret`, `jwtExpiresIn`, `apiPrefix`, and `logLevel`.
- Export boolean helpers `isDev` and `isProd`.

# Dependencies
- `dotenv` (default import): Loads environment variables from a `.env` file (typically at project root) into `process.env`.
- `zod` (named import `z`): A schema declaration/validation library. `z.object`, `z.coerce.number`, `z.enum`, `z.string` are used to define and validate the config schema.

# Exports
- `config` — validated, typed configuration object (named export).
- `isDev` — boolean: `true` when `nodeEnv !== 'production'` (named export).
- `isProd` — boolean: `true` when `nodeEnv === 'production'` (named export).

# Internal Functions
- None. This module runs validation and exports constants at load time; there are no named/internal functions.

# Execution Flow
1. `dotenv.config()` populates `process.env` from `.env`, if present.
2. `configSchema` is defined with the following rule set:
   - `PORT`: coerced to integer, `1..65535`, default `3000`.
   - `NODE_ENV`: enum `development | production | test`, default `development`.
   - `MONGODB_URI`: required non-empty string.
   - `DB_NAME`: string, default `thewovencloudkitchen`.
   - `JWT_SECRET`: string, min 16 characters.
   - `JWT_EXPIRES_IN`: string, default `7d`.
   - `API_PREFIX`: string, default `/api/v1`.
   - `LOG_LEVEL`: enum `error | warn | info | debug`, default `info`.
3. `configSchema.safeParse(process.env)` runs; result checked.
4. If `!parsed.success`, each issue is logged (using `issue.path.join('.')` and `issue.message`) and `process.exit(1)` runs.
5. On success, `config` is built from `parsed.data` and exported; `isDev` and `isProd` are computed and exported.

# Related Files
- `src/server.ts` — imports `config` for `port`, `dbName`, and `nodeEnv`.
- `src/config/swagger.config.ts` — imports `config` for `port` and `apiPrefix` to build Swagger server URLs.
- Any other module that needs configuration (e.g., logger uses `LOG_LEVEL`, DI modules use `JWT_SECRET`, `JWT_EXPIRES_IN`).

# Example Usage
```typescript
import { config, isDev, isProd } from './config';

const port = config.port;          // number
const uri = config.mongoUri;       // string
if (isProd) { console.log('production'); }
```
`.env` file:
```dotenv
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/twk
DB_NAME=thewovencloudkitchen
JWT_SECRET=this-is-a-secret-that-is-long-enough
JWT_EXPIRES_IN=7d
API_PREFIX=/api/v1
LOG_LEVEL=info
```

# Best Practices
- Validate all required environment configuration at startup so misconfigurations fail fast rather than at runtime.
- Provide sensible defaults for optional values (port, env, DB name, JWT expiry, API prefix, log level).
- Use coercion (`z.coerce.number()`) so numeric env vars (which arrive as strings) are converted safely.
- Refuse to start with a weak or missing `JWT_SECRET` (minimum 16 chars) for security.
- Export a single typed `config` object to avoid scattering `process.env` reads across the codebase.

# Common Mistakes
- Not calling `dotenv.config()` before reading `process.env`, so variables from `.env` are never loaded.
- Using `z.string()` for the port or other numeric values without coercion, causing type mismatches.
- Failing to handle `safeParse` failure, which lets the app boot with invalid config and fail later confusingly.
- Using `process.env.X` directly elsewhere instead of the validated `config` object.
- Exiting with `process.exit(1)` on invalid config without printing actionable error messages.

# Notes For Frontend Developers
- This file is server-side only; frontend developers do not usually interact with it directly.
- The `MONGODB_URI` and `DB_NAME` together point to the physical database connection and database name.
- `JWT_EXPIRES_IN` and `API_PREFIX` influence authentication token lifetimes and the versioned API path prefix (`/api/v1` by default), which frontend clients must match when calling the API.
- `LOG_LEVEL` controls how verbose server logs are in different environments.
- If the server refuses to start, it frequently prints a list of invalid/missing environment variables here — a common first place to check for startup failures.
