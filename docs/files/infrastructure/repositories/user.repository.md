# user.repository.ts

# File Path
`src/infrastructure/repositories/user.repository.ts`

# Purpose
This file implements `UserRepository` — the **infrastructure persistence adapter** for the `User` aggregate. It implements the domain `IUserRepository` interface, translating between the Mongoose persistence world (`UserModel` / `UserDocument`) and the pure domain `User` entity. It is registered in the DI container as a **singleton** and is the only place that performs actual MongoDB read/write for users.

By sitting in the infrastructure layer, it keeps database concerns (Mongoose) out of the domain and application layers, honoring Clean Architecture: the domain defines the interface, and this class provides the storage implementation.

# Responsibilities
- Implement every method of `IUserRepository`: `findById`, `findByEmail`, `findAll`, `create`, `update`, `delete`, `count`.
- Normalize input and output: emails are lowercased on write and lookup.
- Validate ObjectId formats before querying (`Types.ObjectId.isValid`) and return `null`/`false` for invalid ids.
- Map raw Mongoose documents to domain `User` entities via the private `mapToEntity`.
- Use lean queries for read paths for performance, and `.toObject()` for created documents.
- Paginate `findAll` results with `skip`/`limit` and return a `FindAllResult` (`{ data, total }`) with documents sorted by `createdAt` descending.
- Partial updates via `findByIdAndUpdate` with a dynamically built patch object.
- Mark itself `@injectable` for DI resolution.

# Dependencies

| Import | Path | Explanation |
| --- | --- | --- |
| `injectable` | `inversify` | Decorator marking the class as resolvable by the DI container. |
| `Types` | `mongoose` | Namespace providing `Types.ObjectId` and the `ObjectId.isValid(id)` static used to validate ids. |
| `UserModel`, `UserDocument` | `../database/models/user.model` | The Mongoose model and document type used for all persistence operations and mapping. |
| `IUserRepository`, `CreateUserData`, `UpdateUserData`, `FindAllResult` | `../../domain/repositories/user-repository.interface` | The domain contract interface plus its input/result types this class implements. |
| `User` | `../../domain/entities/user.entity` | The domain entity type returned by the mapping. |
| `UserRole` | `../../domain/value-objects/user-role` | The role enum used to cast the persisted role string back to a `UserRole` in mapping. |

# Exports
- `UserRepository` — an ES class (`@injectable`) implementing `IUserRepository`.

No other symbols are exported.

# Internal Functions
- `UserRepository` — the implemention class.
  - `findById(id): Promise<User | null>` — (documented)
  - `findByEmail(email): Promise<User | null>` — (documented)
  - `findAll(page, limit): Promise<FindAllResult>` — (documented)
  - `create(data): Promise<User>` — (documented)
  - `update(id, data): Promise<User | null>` — (documented)
  - `delete(id): Promise<boolean>` — (documented)
  - `count(): Promise<number>` — (documented)
  - `mapToEntity(doc): User` — private mapping helper (documented).

# Execution Flow
The class has no constructor body; instances rely on `UserModel` and the domain types. Methods are individually documented below. In summary, read operations query `UserModel` with `.lean()` and map results; write operations use `UserModel.create` / `findByIdAndUpdate` / `findByIdAndDelete`, normalizing emails and validating ids.

# Related Files
- `src/domain/repositories/user-repository.interface.ts` — the contract implemented here.
- `src/domain/entities/user.entity.ts` — the `User` entity produced by `mapToEntity`.
- `src/domain/value-objects/user-role.ts` — `UserRole` enum used in mapping.
- `src/infrastructure/database/models/user.model.ts` — `UserModel` / `UserDocument` source.
- `src/infrastructure/di/container.ts` — binds `IUserRepository` → `UserRepository` (singleton).
- `src/infrastructure/di/container.ts` & seed — the seed consumes the repository's `findByEmail`/`create`.
- `src/infrastructure/repositories/index.ts` — barrel re-exporting `UserRepository`.

# Example Usage
```ts
import { container } from '../di/container';
import { TYPES } from '../../shared/constants/tokens';
import { IUserRepository } from '../../domain/repositories/user-repository.interface';

const repo = container.get<IUserRepository>(TYPES.UserRepository);

const user = await repo.findById('507f1f77bcf86cd799439011');
const byEmail = await repo.findByEmail('Admin@Example.com'); // lowercased internally
const all = await repo.findAll(1, 20);
const created = await repo.create({ email: 'bob@example.com', name: 'Bob', role: 'STAFF', isActive: true });
const updated = await repo.update(userId, { name: 'Bobby' });
const deleted = await repo.delete(userId);
const total = await repo.count();
```

# Best Practices
- Always go through `mapToEntity` so callers receive domain `User` objects, never raw Mongoose documents (protects layering).
- Lowercase emails on both write and lookup to align with the schema's `lowercase: true` + unique index.
- Use `Types.ObjectId.isValid` to short-circuit queries with malformed ids instead of letting Mongo throw.
- Prefer `.lean()` on read-only queries to reduce Mongoose overhead; convert created docs with `.toObject()`.
- Keep pagination defaults small (`limit = 20`) to bound response sizes.

# Common Mistakes
- Returning raw documents to the domain/application layer instead of mapped `User` entities.
- Forgetting to lowercase email on lookup, which misses documents because the schema lowercases on save.
- Calling Mongo operations with an invalid ObjectId string (e.g. from bad API input) without the `isValid` guard.
- Mutating the schema/DB constraints and forgetting to mirror them here (e.g. new fields not mapped), dropping data in conversions.

# Notes For Frontend Developers
- Every user you see in the admin UI came through this repository's mapping — the domain `User` exposes `id`, `email`, `name`, `role`, `isActive`, `createdAt`, `updatedAt` (no `__v`/`_id` leaks).
- `findAll` returns `{ data: User[], total: number }` sorted newest-first (`createdAt` desc) — use `total` for pagination controls.
- Creating/updating a user normalizes the email to lowercase; the API and UI should reflect the lowercased value.
- Invalid ids in update/delete return `null`/`false` respectively (which the API typically maps to 404-style responses).

---

## Function: findById

- Location: `src/infrastructure/repositories/user.repository.ts:10`
- Purpose: Fetches a single user by its MongoDB `_id` (as a string) and returns it as a domain `User`, or `null` if not found / if the id is invalid.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Yes | The user's `_id` as a string (Mongo ObjectId hex). |

- Return Type: `Promise<User \| null>`.
- Throws: Does not throw on valid-but-missing ids (returns `null`); may reject on DB errors.
- Called By: Application use-case handlers (e.g. `GetUserByIdHandler`) and tests.
- Calls:
  - `Types.ObjectId.isValid(id)`
  - `UserModel.findById(id).lean()`
  - `this.mapToEntity(doc)` (only if a doc exists)
- Execution Flow:
  1. If `!Types.ObjectId.isValid(id)`, return `null`.
  2. `const doc = await UserModel.findById(id).lean();`
  3. Return `doc ? this.mapToEntity(doc) : null`.
- Example Input: `findById('507f1f77bcf86cd799439011')`
- Example Output: A `User` object, e.g. `{ id: '507f...', email: 'a@b.com', name: 'Alice', role: 'ADMIN', isActive: true, createdAt: Date, updatedAt: Date }`, or `null`.
- Business Logic: Guards against malformed ids and translates a lean document into the domain entity.
- Edge Cases: Invalid ObjectId string → `null` immediately (no DB call). Valid id with no document → `null`.
- Notes: Uses `.lean()` so the result is a plain object ready for mapping.

## Function: findByEmail

- Location: `src/infrastructure/repositories/user.repository.ts:18`
- Purpose: Fetches a single user by normalized (lowercased) email, returning a domain `User` or `null`.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | `string` | Yes | The user's email address (case-insensitive; lowercased internally). |

- Return Type: `Promise<User \| null>`.
- Throws: Does not throw for a missing match (returns `null`); may reject on DB errors.
- Called By: `seedAdmin` in `seeder.ts`, authentication flows, and handlers.
- Calls:
  - `UserModel.findOne({ email: email.toLowerCase() }).lean()`
  - `this.mapToEntity(doc)` (only if a doc exists)
- Execution Flow:
  1. `const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();`
  2. Return `doc ? this.mapToEntity(doc) : null`.
- Example Input: `findByEmail('Admin@Example.COM')`
- Example Output: The matching `User` (if stored as `admin@example.com`), or `null`.
- Business Logic: Lowercases the input so it matches the schema's lowercased, uniquely-indexed `email` field.
- Edge Cases: Non-existent email → `null`; email with mixed case → still matched after lowercasing.
- Notes: Relies on the unique email index for efficient lookup.

## Function: findAll

- Location: `src/infrastructure/repositories/user.repository.ts:23`
- Purpose: Returns a paginated list of users plus the total count, sorted newest-first by `createdAt`.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | `number` | No (default `1`) | 1-based page number. |
| `limit` | `number` | No (default `20`) | Max number of documents per page. |

- Return Type: `Promise<FindAllResult>` where `FindAllResult = { data: User[]; total: number }`.
- Throws: May reject on DB errors.
- Called By: `GetAllUsersHandler` (list endpoint).
- Calls:
  - `UserModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()`
  - `UserModel.countDocuments()`
  - `docs.map((doc) => this.mapToEntity(doc))`
- Execution Flow:
  1. `const skip = (page - 1) * limit;`
  2. `const [docs, total] = await Promise.all([ ...find with sort/skip/limit..., UserModel.countDocuments() ])` (run in parallel).
  3. Return `{ data: docs.map((doc) => this.mapToEntity(doc)), total }`.
- Example Input: `findAll(2, 10)` — page 2 with 10 per page.
- Example Output: `{ data: [User, User, ...], total: 47 }`.
- Business Logic: Offsets by `(page-1)*limit`; parallelizes the data and total queries; sorts newest first.
- Edge Cases: Values `<= 0` for page/limit could produce negative skip or zero limit; the method assumes callers pass sane positive values (defaults handle omitted args only).
- Notes: `skip`/`limit` style paging — fine for typical admin list sizes; very large collections may prefer cursor-based paging.

## Function: create

- Location: `src/infrastructure/repositories/user.repository.ts:32`
- Purpose: Creates a new user document from `CreateUserData` and returns the resulting domain `User`.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `data` | `CreateUserData` | Yes | `{ email: string; name: string; role: UserRole; isActive: boolean }`. |

- Return Type: `Promise<User>`.
- Throws: Rejects if creation fails, notably on duplicate unique `email` (Mongo E11000).
- Called By: `CreateUserHandler`, and `seedAdmin` in `seeder.ts`.
- Calls:
  - `UserModel.create({ email, name, role, isActive })`
  - `doc.toObject()`
  - `this.mapToEntity(...)`
- Execution Flow:
  1. `const doc = await UserModel.create({ email: data.email.toLowerCase(), name: data.name, role: data.role, isActive: data.isActive });`
  2. Return `this.mapToEntity(doc.toObject())`.
- Example Input: `create({ email: 'BOB@Example.com', name: 'Bob', role: 'STAFF', isActive: true })`
- Example Output: A `User` with `email: 'bob@example.com'`, generated id, and timestamps.
- Business Logic: Lowercases email before insert; converts the created document to a plain object for mapping.
- Edge Cases: Duplicate email → reject (Mongo E11000 duplicate key); the caller should translate this to a 409.
- Notes: `isActive` is passed explicitly from `data` (schema default `true` applies only if omitted).

## Function: update

- Location: `src/infrastructure/repositories/user.repository.ts:42`
- Purpose: Partially updates a user by id using only the provided (defined) fields and returns the updated domain `User`, or `null` if invalid/missing.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Yes | The target user's `_id` string. |
| `data` | `UpdateUserData` | Yes | Partial object with optional `email`, `name`, `role`, `isActive`. |

- Return Type: `Promise<User \| null>`.
- Throws: May reject on DB errors (e.g. duplicate email) — note invalid id returns `null` rather than throwing.
- Called By: `UpdateUserHandler`.
- Calls:
  - `Types.ObjectId.isValid(id)`
  - Builds `patch` object
  - `UserModel.findByIdAndUpdate(id, patch, { new: true }).lean()`
  - `this.mapToEntity(doc)` (only if a doc exists)
- Execution Flow:
  1. If `!Types.ObjectId.isValid(id)`, return `null`.
  2. Build `patch: Record<string, unknown>`; for each field: if `!== undefined`, set it (email is lowercased).
  3. `const doc = await UserModel.findByIdAndUpdate(id, patch, { new: true }).lean();`
  4. Return `doc ? this.mapToEntity(doc) : null`.
- Example Input: `update('507f...', { name: 'Bobby' })`
- Example Output: The updated `User` (new name, updated `updatedAt`), or `null` if invalid/missing id.
- Business Logic: Only defined fields are patched (undefined fields are skipped); email is normalized to lowercase; `{ new: true }` returns the post-update document.
- Edge Cases: Invalid id → `null`; id not found → `null`; empty `data` → patch is `{}` and update becomes a no-op returning current doc.
- Notes: No optimistic-locking/version checking; last-write-wins.

## Function: delete

- Location: `src/infrastructure/repositories/user.repository.ts:56`
- Purpose: Deletes a user document by id and reports whether deletion occurred.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Yes | The target user's `_id` string. |

- Return Type: `Promise<boolean>`.
- Throws: May reject on DB errors; invalid id returns `false` without throwing.
- Called By: `DeleteUserHandler`.
- Calls:
  - `Types.ObjectId.isValid(id)`
  - `UserModel.findByIdAndDelete(id)`
- Execution Flow:
  1. If `!Types.ObjectId.isValid(id)`, return `false`.
  2. `const result = await UserModel.findByIdAndDelete(id);`
  3. Return `result !== null`.
- Example Input: `delete('507f1f77bcf86cd799439011')`
- Example Output: `true` if a document was removed, `false` if not found or invalid id.
- Business Logic: Distinguishes a successful deletion (`true`) from a missing/invalid target (`false`).
- Edge Cases: Invalid id → `false`; id not found → `/` `result` is `null` → `false`.
- Notes: Hard delete (no soft-delete flag used).

## Function: count

- Location: `src/infrastructure/repositories/user.repository.ts:64`
- Purpose: Returns the total number of user documents in the collection.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| *(none)* | — | — | Takes no arguments. |

- Return Type: `Promise<number>`.
- Throws: May reject on DB errors.
- Called By: Statistics/stats handlers or callers needing a total count.
- Calls: `UserModel.countDocuments()`.
- Execution Flow: `return UserModel.countDocuments();`
- Example Input: `await count()`
- Example Output: `47`
- Business Logic: Counts all documents in the `users` collection (no filter).
- Edge Cases: Empty collection → `0`.
- Notes: `countDocuments` is accurate for the full collection but more expensive than estimated counts on very large datasets.

## Function: mapToEntity

- Location: `src/infrastructure/repositories/user.repository.ts:68`
- Purpose: Private helper that converts a raw Mongoose document (or plain object) into a domain `User` entity, converting `_id` to string `id` and casting `role` to `UserRole`.
- Parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `doc` | `UserDocument \| Record<string, any>` | Yes | A lean/plain user document, or the `.toObject()` result of a created document. |

- Return Type: `User` (the domain entity).
- Throws: Does not throw (uses `any` casts and defensive date defaults).
- Called By: `findById`, `findByEmail`, `findAll`, `create`, `update`.
- Calls: (none — pure transformation.)
- Execution Flow:
  1. `id: String(doc._id)` — convert ObjectId to string.
  2. Copy `email`, `name` (via `(doc as any)` casts).
  3. `role: (doc as any).role as UserRole` — cast string to the enum.
  4. `isActive: (doc as any).isActive`.
  5. `createdAt: (doc as any).createdAt || new Date()` — fallback to now if absent.
  6. `updatedAt: (doc as any).updatedAt || new Date()` — same fallback.
  7. Return the assembled `User`.
- Example Input: A lean doc `{ _id: ObjectId, email: 'a@b.com', name: 'A', role: 'ADMIN', isActive: true, createdAt: Date, updatedAt: Date }`
- Example Output: `{ id: '507f...', email: 'a@b.com', name: 'A', role: 'ADMIN', isActive: true, createdAt: Date, updatedAt: Date }`
- Business Logic: Encapsulates the mapping/translation logic so it isn't duplicated across methods; guarantees domain-shaped output.
- Edge Cases: Missing `createdAt`/`updatedAt` → falls back to current date; any other missing field stays `undefined`.
- Notes: Uses `(doc as any)` casts, so it's tolerant of loosely-typed inputs but also weakly typed internally.
