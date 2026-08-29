# user.model.ts

# File Path
`src/infrastructure/database/models/user.model.ts`

# Purpose
This file defines the Mongoose **schema**, **model**, and **document type** for a `User`. It is the single source of truth for how user documents are structured, validated, and indexed in MongoDB's `users` collection. It sits in the infrastructure layer because it represents the persistence-storage concern of the data, distinct from the pure domain `User` entity in `src/domain/entities/user.entity.ts`.

Key responsibilities introduced here are the database-level constraints: required fields, unique email, role enum, indexes, timestamps, and the collection name.

# Responsibilities
- Define the `userSchema` Mongoose `Schema` with field types, validation, defaults, and per-field indexes.
- Configure schema options: `timestamps`, `versionKey`, and the target `collection` name (`users`).
- Declare compound indexes: unique index on `email`, and a compound index on `(role, isActive)`.
- Derive and export the `UserDocument` type from the schema via `InferSchemaType`, enriched with `_id`, `createdAt`, `updatedAt`.
- Register and export the `UserModel` so repositories and the seeding script can access the collection.

# Dependencies

| Import | Path | Explanation |
| --- | --- | --- |
| `Schema` | `mongoose` | Class used to construct the schema definition. |
| `model` | `mongoose` | Factory that compiles a `Schema` into a compiled `Model` bound to a collection. |
| `Model` | `mongoose` | Type representing the compiled model (interface used to type `UserModel`). |
| `Types` | `mongoose` | Provides `Types.ObjectId`, used to type the `_id` field on the document. |
| `InferSchemaType` | `mongoose` | Utility type that statically derives the shape of a document from a schema instance. |

Indirectly, because `model` is a Mongoose operation, using this module requires an open or connectable MongoDB connection (though the schema definition itself does not connect).

# Exports
- `UserDocument` — a **type-only** export (derived via `InferSchemaType<typeof userSchema>` then intersected with `{ _id: Types.ObjectId; createdAt: Date; updatedAt: Date }`).
- `UserModel` — a **const** export of type `Model<UserDocument>`, the compiled Mongoose model named `'User'` bound to the `users` collection.

The `userSchema` itself (`const userSchema`) is **not exported** — it is module-private.

# Internal Functions
None. This file contains no functions or methods; it only declares a schema and a model.

# Execution Flow
1. `Schema` is imported from Mongoose.
2. The `userSchema` constant is constructed with the field definitions:
   - `email`: string, required, unique index, trimmed, lowercased.
   - `name`: string, required, trimmed.
   - `role`: string, restricted to an enum (`ADMIN`/`MANAGER`/`STAFF`), defaults to `'STAFF'`, indexed.
   - `isActive`: boolean, defaults to `true`, indexed.
3. Schema options are set: `timestamps: true`, `versionKey: '__v'`, `collection: 'users'`.
4. Compound indexes are added: unique index on `email`, and compound index on `(role, isActive)`.
5. The `UserDocument` type is derived with `InferSchemaType` and intersected with `_id`, `createdAt`, `updatedAt`.
6. `UserModel` is created via `model<UserDocument>('User', userSchema)` and exported.
7. When `UserModel` is first used with a connection, Mongoose builds the MongoDB indexes (auto-indexing is controlled by the connection's `autoIndex` option).

# Related Files
- `src/infrastructure/database/models/index.ts` — barrel that re-exports `UserModel` / `UserDocument`.
- `src/infrastructure/database/mongoose/connection.ts` — establishes the connection; its `autoIndex` option governs whether the indexes here are auto-built.
- `src/infrastructure/database/seed/seeder.ts` — calls `UserModel.init()` / `UserModel.syncIndexes()` and relies on `UserModel` for admin seeding.
- `src/infrastructure/repositories/user.repository.ts` — consumes `UserModel` and `UserDocument` for all CRUD persistence.
- `src/domain/entities/user.entity.ts` — the pure domain `User` interface this persisted shape maps to.
- `src/domain/value-objects/user-role.ts` — the `UserRole` enum whose string values mirror the schema's `role` enum.

# Example Usage
```ts
import { UserModel, UserDocument } from '../models/user.model';

// Create a new user document via the model
const doc = await UserModel.create({
  email: 'alice@example.com',
  name: 'Alice',
  role: 'ADMIN',
  isActive: true,
});

// The returned document includes auto-managed timestamps and _id
console.log(doc._id, doc.createdAt, doc.updatedAt);

const typedDoc: UserDocument | null = await UserModel.findOne({ email: 'alice@example.com' });
```

# Best Practices
- Keep the schema the single authority for DB constraints; reflect the same rules in the domain entity and in the repository, but do not duplicate validation logic.
- Rely on `timestamps: true` instead of manually maintaining `createdAt`/`updatedAt`.
- Use the enum on `role` at the Mongoose level as a defense-in-depth guard behind the TypeScript `UserRole` enum.
- Since `email` is lowercased at the schema level, always store emails lowercased to keep the unique index and lookups consistent.

# Common Mistakes
- Forgetting that `email` is `lowercase: true`, so queries must also use lowercased values or they can miss documents (the repository already handles this via `.toLowerCase()`).
- Assuming auto-indexing always runs; in production, `autoIndex` is disabled (see connection options), so indexes must be created via `syncIndexes` or a migration before `findById`/email lookups are relied upon.
- Duplicating the schema's `role` enum as a plain string, causing invalid role values to be rejected only at write time.

# Notes For Frontend Developers
- The API exposes these fields as JSON: `_id` (string ObjectId) and `id` (set by the mapper), `email`, `name`, `role`, `isActive`, `createdAt`, `updatedAt`.
- `createdAt` and `updatedAt` come back as ISO-8601 strings; parse with `new Date(...)` before display to convert to local timezone.
- The `role` values you will encounter are exactly `ADMIN`, `MANAGER`, and `STAFF`; the UI should restrict role-picker options to these.
- The persisted `user._id` is what you use to call endpoint paths like `/users/:id` for update/delete operations.

---

## Function: (none)

This file declares a schema and model but defines **no functions or methods**.
