# Folder: infrastructure

# Path: src/infrastructure/

# Purpose

The **infrastructure** layer is the outer framework layer. It contains concrete, technology-specific implementations behind the interfaces that will be defined in `domain` and used by `application`. Currently the only implemented piece is the **Mongoose database connection**. Everything else is empty scaffolding for future business stories.

There is **no dependency injection container** (no Inversify), **no seeder**, and **no repository or model implementations** yet. The project uses plain JavaScript CommonJS modules with direct `require()` imports.

# Responsibilities

- **Database connection** (`database/mongoose/connection.js`): The `connectDB()` and `disconnectDB()` functions that connect to and disconnect from MongoDB using `mongoose.connect()`. Registers connection lifecycle event handlers (`connected`, `error`, `disconnected`) that log via the shared winston logger.
- **Mongoose models** (`database/models/`): Empty placeholder (`.gitkeep`). Will contain Mongoose schema/collection definitions for future business entities.
- **Repositories** (`repositories/`): Empty placeholder (`.gitkeep`). Will contain concrete repository implementations that fulfill the `domain` repository interfaces.
- **Config** (`config/`): Empty placeholder (`.gitkeep`). Reserved for infrastructure-level configuration if needed in the future.

# Why this folder exists

Clean Architecture keeps frameworks at the edge so that business logic (in `domain`/`application`) is not polluted by database or container libraries. This folder is that edge — it hosts every concrete dependency and exposes them to the rest of the app through *interfaces* (defined in `domain`). It is the only layer that knows about Mongoose concretely.

# What files belong here

Currently (Story 0.2):

```
infrastructure/
├── database/
│   ├── mongoose/
│   │   └── connection.js       # connectDB()/disconnectDB() via mongoose.connect
│   └── models/                 # .gitkeep — EMPTY placeholder for future Mongoose models
├── repositories/               # .gitkeep — EMPTY placeholder for future repository impls
└── config/                     # .gitkeep — EMPTY placeholder
```

Future structure (example):

```
infrastructure/
├── database/
│   ├── mongoose/
│   │   └── connection.js       # connectDB()/disconnectDB()
│   └── models/
│       ├── user.model.js       # Mongoose User schema
│       └── index.js
├── repositories/
│   ├── user.repository.js      # IUserRepository implementation
│   └── index.js
└── config/
    └── index.js                # Infrastructure-specific config (if needed)
```

# Which layer depends on it

Currently:

- `server.js` (top-level) imports `connectDB`/`disconnectDB` to manage the database lifecycle on startup/shutdown.

In the future:

- `api/controllers` will import concrete repositories or services from here (only for dependency wiring, not for business logic).

The infrastructure layer itself depends on:
- `config` — `config.mongoUri`, `config.dbName`, `config.nodeEnv`
- `shared` — `logger`

Future dependencies:
- `domain` — entities, repository interfaces (to implement them)

# Which layer should NOT depend on it

- `domain` and `application` must **never** import anything from `infrastructure`. If a handler or entity needed a Mongoose class, the architecture would be broken.
- `application/handlers` must only use the `domain` repository *interface*, never the concrete repository from `infrastructure`.

# Flow

```
server.js ──► connectDB() / disconnectDB()
                  │
                  ▼
infrastructure/database/mongoose/connection.js
                  │
                  ▼
           mongoose.connect(config.mongoUri, { dbName: config.dbName, autoIndex: !isProd })

Future flow:
application/handlers ──(domain repository interface)──►
        │
        ▼
infrastructure/repositories/<entity>.repository.js   ◄── implements domain interface
        │
        ▼
infrastructure/database/models/<entity>.model.js     ◄── Mongoose schema
        │
        ▼
MongoDB
```

# Example

`infrastructure/database/mongoose/connection.js` — the only implemented file:

```js
const mongoose = require('mongoose');
const { config, isProd } = require('../../../config');
const { logger } = require('../../../shared/utils/logger');

mongoose.set('strictQuery', true);

async function connectDB() {
  mongoose.connection.on('connected', () => {
    logger.info(`MongoDB connected to database: ${config.dbName}`);
  });
  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error: error.message });
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(config.mongoUri, {
    dbName: config.dbName,
    autoIndex: !isProd,
  });
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
```

`server.js` uses it at startup:

```js
await connectDB();
server = app.listen(config.port, () => { /* ... */ });
```

And on shutdown:

```js
server.close(async () => {
  await disconnectDB();
  process.exit(0);
});
```

# Related Folders

- `docs/folders/domain.md` — the repository interfaces that `infrastructure/repositories` (future) will implement.
- `docs/folders/shared.md` — the `logger` used by `connection.js`.
- `docs/folders/config.md` — the connection reads `config.mongoUri` / `config.dbName`.
