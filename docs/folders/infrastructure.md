# Folder: infrastructure

# Path: src/infrastructure

# Purpose

The **infrastructure** layer is the outer framework layer. It contains all the concrete, technology-specific implementations behind the interfaces defined in `domain` and used by `application`. This is where the real work of persistence (Mongoose), dependency wiring (Inversify DI), and data seeding happens. If you swap a technology, you change this folder — and nothing else.

# Responsibilities

- **Database connection** (`database/mongoose/`): The `MongoConnection` singleton that connects to and disconnects from MongoDB, and registers connection lifecycle event handlers.
- **Mongoose models** (`database/models/`): The concrete `UserModel` schema/collection definition backed by Mongoose (`user.model.ts`).
- **Seeding** (`database/seed/`): The `DatabaseSeeder` and its standalone entry script (`index.ts`) that syncs indexes and creates the initial admin user.
- **Repositories** (`repositories/`): The concrete `UserRepository` that implements the `domain` `IUserRepository` interface by mapping between Mongoose documents and `User` entities.
- **Dependency injection** (`di/`): The `container` that binds every interface/abstraction in the app to its concrete implementation using Inversify and the `TYPES` tokens.

# Why this folder exists

Clean Architecture keeps frameworks at the edge so that business logic (in `domain`/`application`) is not polluted by the database or container libraries. This folder is that edge — it hosts every concrete dependency and exposes them to the rest of the app through *interfaces* (domain) and *DI tokens* (shared). It is the only layer that knows about Mongoose and Inversify concretely. A Frontend Developer rarely needs to look here, but if they ever wonder "where does the data actually come from and how is it wired?" — this is it.

# What files belong here

```
infrastructure/
├── database/
│   ├── mongoose/
│   │   ├── connection.ts           # MongoConnection singleton (connect/disconnect/events)
│   │   └── index.ts
│   ├── models/
│   │   ├── user.model.ts           # Mongoose UserModel schema
│   │   └── index.ts
│   └── seed/
│       ├── index.ts                # standalone seed entry script
│       └── seeder.ts               # DatabaseSeeder: syncIndexes + seedAdmin
├── repositories/
│   ├── user.repository.ts          # Mongoose-backed IUserRepository implementation
│   └── index.ts
└── di/
    ├── container.ts                # Inversify Container + bindings
    └── index.ts
```

# Which layer depends on it

Almost nothing *outside* the framework depends on this layer directly — that is intentional:

- `api/controllers` import the `container` (from `infrastructure/di`) solely to resolve handlers; this is the single allowed cross-layer coupling for wiring.
- `server.ts` (top-level) imports `MongoConnection` to connect/disconnect on startup/shutdown.
- `infrastructure/di/container.ts` depends on the *concrete* repositories and the *application* handlers to register bindings.

The infrastructure layer itself depends on: `domain` (interfaces/entities), `application` (handlers, for DI binding), `shared` (TYPES tokens, logger), and `config`.

# Which layer should NOT depend on it

- `domain` and `application` must **never** import anything from `infrastructure`. If a handler or entity needed a Mongo class, the architecture would be broken.
- `application/handlers` must only use the `domain` repository *interface* (injected), never the concrete `UserRepository`.
- Nothing outside `infrastructure/di` and `server.ts` should reach into `infrastructure/database` directly.

# Flow

```
application/handlers ──(injected IUserRepository)──►
        │
        ▼
infrastructure/repositories/UserRepository        ◄── implements IUserRepository
        │
        ▼
infrastructure/database/models/UserModel (Mongoose schema)
        │
        ▼
MongoDB

Wiring: infrastructure/di/container.ts
  binds TYPES.UserRepository → UserRepository (singleton)
  binds TYPES.<X>Handler      → <X>Handler
```

The `container` is the "glue": controllers ask it to resolve a handler, and that handler transparently receives its dependencies (like `UserRepository`) via constructor injection.

# Example

`infrastructure/di/container.ts` wires the whole app:

```ts
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
container.bind<CreateUserHandler>(TYPES.CreateUserHandler).to(CreateUserHandler);
// ... other handlers
```

`infrastructure/repositories/user.repository.ts` reduces this to something domain-shaped:

```ts
async findById(id: string): Promise<User | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await UserModel.findById(id).lean();
  return doc ? this.mapToEntity(doc) : null;
}
```

It calls the concrete Mongoose `UserModel`, then maps the raw document into a `domain/entities/user.entity.ts` `User` via `mapToEntity` — keeping Mongoose specifics entirely inside this layer.

# Related Folders

- `docs\folders\domain.md` — the `IUserRepository` interface that `UserRepository` implements.
- `docs\folders\application.md` — the handlers bound into the DI container.
- `docs\folders\shared.md` — the `TYPES` tokens and logger used throughout.
- `docs\folders\config.md` — the connection reads `config.mongoUri` / `config.dbName`.
