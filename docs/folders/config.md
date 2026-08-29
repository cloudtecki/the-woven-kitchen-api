# Folder: config

# Path: src/config

# Purpose

The **config** folder is a leaf dependency that provides the application's runtime configuration. It centralizes environment-variable parsing/validation (`index.ts`) and OpenAPI/Swagger document generation (`swagger.config.ts`) so that every other layer can read settings from a single, typed, validated source instead of touching `process.env` directly.

# Responsibilities

- **Environment config** (`index.ts`): Load `.env` via `dotenv`, define a zod schema describing every required/optional setting, validate the parsed environment, and export a typed `config` object plus `isDev`/`isProd` helpers.
- **Swagger config** (`swagger.config.ts`): Build the OpenAPI 3.0 spec object (`swaggerSpec`) from a `swagger-jsdoc` definition — servers, security schemes, shared schemas (User, ApiError, ValidationError) — and scan the route/controller/app source files for JSDoc annotations.

# Why this folder exists

Configuration is cross-cutting: the database (`infrastructure`), the logger (`shared`), the auth middleware (`shared`), and the bootstrap (`server.ts`) all need settings like the port, Mongo URI, JWT secret, and environment. Keeping it in one validated module ensures: settings fail fast at startup (zod `safeParse` exits on invalid/incomplete config), they are strongly typed, and no layer has to parse its own `process.env`. The Swagger spec is similarly centralized so API docs stay in sync with the code that defines the endpoints.

# What files belong here

```
config/
├── index.ts               # config object (typed) + isDev/isProd
└── swagger.config.ts      # swaggerSpec (OpenAPI 3.0)
```

# Which layer depends on it

Multiple layers import `config` because it is a shared leaf:

- `server.ts` (top-level) — `config.port`, `config.dbName`, `config.nodeEnv`.
- `src/app.ts` — imports `swaggerSpec` to mount `/api/docs`.
- `infrastructure/database/mongoose/connection.ts` — `config.mongoUri`, `config.dbName`, `config.nodeEnv`.
- `shared/utils/logger.ts` — `config.nodeEnv`, `config.logLevel`.
- `shared/middleware/auth.middleware.ts` — `config.jwtSecret`.

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
export config { port, nodeEnv, mongoUri, dbName, jwtSecret, ... }
export isDev / isProd

swagger.config.ts:
  builds swaggerSpec from definition + JSDoc scan of src/api/routes, controllers, app.ts
      │
app.ts mounts swaggerUi at /api/docs using swaggerSpec
```

On startup, `server.ts` reads `config.port` to listen and `config.dbName` to log the DB; `connection.ts` uses `config.mongoUri`/`config.dbName` to connect; the logger uses `config.logLevel`/`config.nodeEnv`.

# Example

`src/server.ts` bootstraps with the config object:

```ts
const PORT = config.port;
await MongoConnection.getInstance().connect();   // uses config.mongoUri, config.dbName
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
```

And the Mongo connection reads the same source:

```ts
await mongoose.connect(config.mongoUri, { dbName: config.dbName, autoIndex: !isProd() });
```

Because `isProd()` and `config.nodeEnv` come from the validated config, the database can reliably decide whether to build indexes at runtime.

# Related Folders

- `src\server.ts` / `src\app.ts` (top-level) — read `config` and `swaggerSpec`.
- `docs\folders\infrastructure.md` — the Mongo connection reads its settings from `config`.
- `docs\folders\shared.md` — the logger and auth middleware read `config.nodeEnv` / `config.jwtSecret`.
