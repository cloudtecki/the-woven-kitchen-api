# Folder: config

# Path: src/config/

# Purpose

The **config** folder is a leaf dependency that provides the application's runtime configuration. It centralizes environment-variable parsing/validation (`index.js`) and OpenAPI/Swagger document generation (`swagger.js`) so that every other layer can read settings from a single, validated source instead of touching `process.env` directly.

# Responsibilities

- **Environment config** (`index.js`): Load `.env` via `dotenv`, define a Zod schema describing every required/optional setting, validate the parsed environment, and export a `config` object plus an `isProd` boolean helper. Exits the process immediately if validation fails.
- **Swagger config** (`swagger.js`): Build the OpenAPI 3.0 spec object (`swaggerSpec`) using `swagger-jsdoc` — defining server URLs, shared schemas (`Health`, `ApiError`), and the `/api/health` endpoint path.

# Why this folder exists

Configuration is cross-cutting: the database connection (`infrastructure`), the logger (`shared`), the app assembly (`app.js`), and the bootstrap (`server.js`) all need settings like the port, Mongo URI, and environment. Keeping it in one validated module ensures: settings fail fast at startup (Zod `safeParse` exits on invalid config), and no layer has to parse its own `process.env`. The Swagger spec is similarly centralized so API docs stay in sync with the code that defines the endpoints.

# What files belong here

```
config/
├── index.js               # config object + isProd (Zod-validated env vars)
└── swagger.js             # swaggerSpec (OpenAPI 3.0)
```

# Which layer depends on it

Multiple layers import `config` because it is a shared leaf:

- `server.js` (top-level) — `config.port`, `config.nodeEnv`
- `app.js` (top-level) — imports `swaggerSpec` to mount `/api-docs`, imports `config.apiPrefix`
- `infrastructure/database/mongoose/connection.js` — `config.mongoUri`, `config.dbName`, `config.nodeEnv`
- `shared/utils/logger.js` — `config.nodeEnv`, `config.logLevel`

The `config` folder itself depends on only external libraries (`dotenv`, `zod`, `swagger-jsdoc`) — nothing from the app layers.

# Which layer should NOT depend on it

- `config` must **not** import from `api`, `application`, `domain`, `infrastructure`, or `shared`. It is a foundation leaf — importing app code would create circular/upward dependencies.
- App layers should read settings through the exported `config` object rather than calling `process.env` themselves, keeping validation in one place.

# Flow

```
dotenv.config()
      │
      ▼
zod safeParse(process.env) ──(invalid)──► log errors + process.exit(1)
      │  (valid)
      ▼
export config { nodeEnv, port, mongoUri, dbName, apiPrefix, logLevel }
export isProd

swagger.js:
  builds swaggerSpec from definition with server URL, shared schemas, and /api/health path
      │
app.js mounts swaggerUi at /api-docs using swaggerSpec
```

On startup, `server.js` reads `config.port` to listen; `connection.js` uses `config.mongoUri`/`config.dbName` to connect; the logger uses `config.logLevel`/`config.nodeEnv` to choose format and level.

# Example

`src/server.js` bootstraps with the config object:

```js
const { config } = require('./config');
const { connectDB } = require('./infrastructure/database/mongoose/connection');

await connectDB();                                      // uses config.mongoUri, config.dbName
app.listen(config.port, () => {
  logger.info(`API running on port ${config.port} (${config.nodeEnv})`);
});
```

And the Mongo connection reads the same source:

```js
await mongoose.connect(config.mongoUri, {
  dbName: config.dbName,
  autoIndex: !isProd,
});
```

Because `isProd` and `config.nodeEnv` come from the validated config, the database can reliably decide whether to build indexes at runtime.

# Related Folders

- `src/server.js` / `src/app.js` (top-level) — read `config` and `swaggerSpec`.
- `docs/folders/infrastructure.md` — the Mongo connection reads its settings from `config`.
- `docs/folders/shared.md` — the logger reads `config.nodeEnv` / `config.logLevel`.
