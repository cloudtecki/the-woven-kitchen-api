# seeder.ts

# File Path
`src/infrastructure/database/seed/seeder.ts`

# Purpose
This file defines the `DatabaseSeeder` class — an Inversify-`injectable` component responsible for preparing the database for a fresh environment. It performs two operations: (1) ensuring MongoDB indexes are in sync with the current schema, and (2) seeding a default admin user if one does not already exist. It is designed to be **idempotent** so it can be run repeatedly without harmful side effects.

It depends on the `IUserRepository` (injected via the DI container) rather than touching the Mongoose model directly for user writes, respecting the Clean Architecture direction (infrastructure → domain interface). It uses `UserModel` for index synchronization.

It also exports the `SeedConfig` interface that configures the seeding operation.

# Responsibilities
- Define the `SeedConfig` configuration contract (admin identity).
- Declare itself `@injectable` for DI container resolution.
- Inject and hold the `IUserRepository` dependency.
- Expose `run(config)` as the single public entry point.
- Synchronize MongoDB indexes with the schema (guarded, non-fatal on failure).
- Seed an admin user idempotently (only if none exists with the given email).
- Emit structured log messages throughout the process.

# Dependencies

| Import | Path | Explanation |
| --- | --- | --- |
| `injectable`, `inject` | `inversify` | Decorators/types for DI: `@injectable()` marks the class as resolvable; `@inject(TYPES.UserRepository)` injects the repository into the constructor. |
| `UserModel` | `../models/user.model` | The Mongoose user model, used only for `init()` and `syncIndexes()` during index synchronization. |
| `IUserRepository` | `../../../domain/repositories/user-repository.interface` | Domain contract used to type the injected dependency and its methods (`findByEmail`, `create`). |
| `UserRole` | `../../../domain/value-objects/user-role` | The `UserRole` enum; `UserRole.ADMIN` is assigned to the seeded admin. |
| `TYPES` | `../../../shared/constants/tokens` | Symbol keys; `TYPES.UserRepository` identifies the injected binding. |
| `logger` | `../../../shared/utils/logger` | Winston logger for `info`/`error` messages. |

# Exports
- `SeedConfig` — an **interface** (type) describing seed configuration: `adminEmail` (string), `adminName` (string), and optional `adminPassword` (string).
- `DatabaseSeeder` — an **ES class**, marked `@injectable`.

# Internal Functions
- `DatabaseSeeder` — the injectable class.
  - `constructor(userRepository: IUserRepository)` — DI-injected constructor (private method).
  - `run(config: SeedConfig): Promise<void>` — public entry point (documented).
  - `syncIndexes(): Promise<void>` — private helper (documented).
  - `seedAdmin(config: SeedConfig): Promise<void>` — private helper (documented).

# Execution Flow
1. DI container constructs `DatabaseSeeder`, injecting the singleton `IUserRepository`.
2. A caller invokes `run(config)`:
   - `await this.syncIndexes()` — synchronize MongoDB indexes.
   - `await this.seedAdmin(config)` — ensure the admin user exists.
3. `syncIndexes()`:
   - `await UserModel.init()` (build schema/connection), then `await UserModel.syncIndexes()`.
   - Log `MongoDB indexes synchronized` on success.
   - On error, log `Failed to sync indexes` (non-fatal; the error is swallowed so seeding can continue).
4. `seedAdmin(config)`:
   - Look up an existing user by `config.adminEmail` via the repository.
   - If found → log `Admin user already exists: <email>` and return (idempotent no-op).
   - If not found → `userRepository.create({ email, name, role: UserRole.ADMIN, isActive: true })`.
   - Log `Seeded admin user: <email>`.

# Related Files
- `src/infrastructure/database/seed/index.ts` — the script that instantiates and runs this seeder.
- `src/infrastructure/database/models/user.model.ts` — `UserModel` used for index sync.
- `src/domain/repositories/user-repository.interface.ts` — the `IUserRepository` contract.
- `src/domain/value-objects/user-role.ts` — the `UserRole` enum.
- `src/shared/constants/tokens.ts` — `TYPES.UserRepository`.
- `src/infrastructure/di/container.ts` — resolves/injects the repository.

# Example Usage
```ts
import { DatabaseSeeder, SeedConfig } from './seeder';
import { container } from '../../di/container';
import { TYPES } from '../../../shared/constants/tokens';
import { IUserRepository } from '../../../domain/repositories/user-repository.interface';

const config: SeedConfig = {
  adminEmail: 'admin@example.com',
  adminName: 'System Administrator',
};

const seeder = new DatabaseSeeder(
  container.get<IUserRepository>(TYPES.UserRepository)
);

await seeder.run(config);
```

# Best Practices
- Always run through DI so the injected repository is the same singleton the application uses, keeping behavior consistent.
- Keep `seedAdmin` idempotent — the `findByEmail` guard prevents duplicate admins on re-runs.
- Let index sync failures be non-fatal (logged) so a seeding run isn't blocked by transient index issues; address index problems separately.
- Only seed in controlled environments/migrations, not on production server startup (unless explicitly intended).

# Common Mistakes
- Passing a password into the config that the repository/`create` ignores — note `SeedConfig.adminPassword` is optional and **not** currently used by `seedAdmin`/repository (no password hashing here).
- Depending on the seeded admin existing with a specific email without accounting for the `.toLowerCase()` applied at the script level; the `seedAdmin` lookup uses the config email as-is (which the caller already lowercased).
- Treating `syncIndexes` as fatal if it throws — the implementation swallows the error, so callers should not assume seeding stops.
- Forgetting that `UserModel.create` requires `name` and `isActive`; `seedAdmin` supplies both.

# Notes For Frontend Developers
- The seeder creates a single `ADMIN` user with the configured email; if you need a known login for local dev, set `SEED_ADMIN_EMAIL` accordingly before running the seed.
- The seeded `isActive: true` means the admin account is enabled and can authenticate immediately.
- Passwords are **not** handled by this seeder — authentication/credential provisioning is out of scope here; the admin record here has no password field.

---

## Function: constructor

- Location: `src/infrastructure/database/seed/seeder.ts:16`
- Purpose: Injects and stores the `IUserRepository` dependency used for admin-user operations.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `userRepository` | `IUserRepository` | Yes | The repository instance injected via `@inject(TYPES.UserRepository)`; stored as a private field. |

- Return Type: `void` (constructor).
- Throws: Does not throw (DI guarantees the binding resolves).
- Called By: The Inversify container (or manual instantiation).
- Calls: (none — just assigns the private field.)
- Execution Flow:
  1. Store the injected `userRepository` into the private property `this.userRepository`.
- Example Input: `new DatabaseSeeder(container.get<IUserRepository>(TYPES.UserRepository))`
- Example Output: A `DatabaseSeeder` instance holding the repository.
- Business Logic: Supplies the persistence dependency so `seedAdmin` can query/create users through the domain repository abstraction.
- Edge Cases: If the container has no `TYPES.UserRepository` binding, Inversify throws at resolution/construction time.
- Notes: The repository is injected, so `DatabaseSeeder` never touches the Mongoose model for user writes.

## Function: run

- Location: `src/infrastructure/database/seed/seeder.ts:18`
- Purpose: Public entry point orchestrating index synchronization and admin seeding.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `config` | `SeedConfig` | Yes | Seed configuration: `adminEmail`, `adminName`, optional `adminPassword`. |

- Return Type: `Promise<void>`.
- Throws: Rejects if `syncIndexes` or `seedAdmin` throws; note `syncIndexes` swallows its own internal errors.
- Called By: `src/infrastructure/database/seed/index.ts` (`await seeder.run(seedConfig)`).
- Calls:
  - `this.syncIndexes()`
  - `this.seedAdmin(config)`
- Execution Flow:
  1. `await this.syncIndexes()` — synchronize MongoDB indexes with the schema.
  2. `await this.seedAdmin(config)` — ensure the admin user exists.
  3. Resolve.
- Example Input: `await seeder.run({ adminEmail: 'admin@example.com', adminName: 'Admin' })`
- Example Output: Resolves with `void`; logs index-sync and admin-seed messages.
- Business Logic: Defines the ordered, idempotent initialization routine for a fresh database.
- Edge Cases: If `syncIndexes` fails internally it is swallowed, and `seedAdmin` still runs.
- Notes: The `adminPassword` field in config is currently unused by this method.

## Function: syncIndexes

- Location: `src/infrastructure/database/seed/seeder.ts:23`
- Purpose: Ensures the MongoDB collection's indexes match the current Mongoose schema (`init` + `syncIndexes`), so lookups by unique email and compound queries use proper indexes.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| *(none)* | — | — | Takes no arguments. |

- Return Type: `Promise<void>`.
- Throws: Internal errors are caught and logged; it does **not** rethrow (fail-soft behavior).
- Called By: `run()`.
- Calls:
  - `UserModel.init()` — ensure the model/schema is initialized against the connection.
  - `UserModel.syncIndexes()` — create/update indexes to match the schema.
  - `logger.info('MongoDB indexes synchronized')` on success.
  - `logger.error('Failed to sync indexes', ...)` on failure.
- Execution Flow:
  1. Try: `await UserModel.init()`; then `await UserModel.syncIndexes()`.
  2. On success, log `MongoDB indexes synchronized`.
  3. Catch: log `Failed to sync indexes` with the error message; do not rethrow.
- Example Input: (none)
- Example Output: Resolves with `void`; logs index status.
- Business Logic: Especially important because production disables automatic `autoIndex`; this explicitly builds the unique email and compound `(role, isActive)` indexes needed by queries.
- Edge Cases:
  - MongoDB connection issues → caught and logged, seeding continues.
  - Missing permissions to build indexes → caught and logged.
- Notes: Non-fatal by design; a failed sync won't abort the admin seeding.

## Function: seedAdmin

- Location: `src/infrastructure/database/seed/seeder.ts:33`
- Purpose: Idempotently creates the default admin user if none exists with the configured email.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `config` | `SeedConfig` | Yes | Provides `adminEmail` and `adminName` for the admin to create. |

- Return Type: `Promise<void>`.
- Throws: Propagates repository errors (e.g. create failures) — unlike `syncIndexes`, this is **not** swallowed.
- Called By: `run()`.
- Calls:
  - `this.userRepository.findByEmail(config.adminEmail)`
  - `logger.info('Admin user already exists: ...')` if found.
  - `this.userRepository.create({ email, name, role: UserRole.ADMIN, isActive: true })`
  - `logger.info('Seeded admin user: ...')`.
- Execution Flow:
  1. `const existing = await this.userRepository.findByEmail(config.adminEmail)`.
  2. If `existing` is truthy → log `Admin user already exists: <email>` and return (no-op).
  3. Otherwise, `await this.userRepository.create({ email: config.adminEmail, name: config.adminName, role: UserRole.ADMIN, isActive: true })`.
  4. Log `Seeded admin user: <email>`.
- Example Input: `await seeder.seedAdmin({ adminEmail: 'admin@example.com', adminName: 'System Administrator' })`
- Example Output: Resolves with `void`; either logs "already exists" or creates the admin record and logs "Seeded admin user".
- Business Logic: Guarantees exactly one admin per email; uses the domain `UserRole.ADMIN` and `isActive: true` (enabled account).
- Edge Cases:
  - Email already present (possibly from a previous run) → idempotent no-op.
  - Repository create fails (e.g. unique-email conflict racing) → rejects and propagates to the caller.
- Notes: `adminPassword` from the config is not referenced here; no credentials are stored.
