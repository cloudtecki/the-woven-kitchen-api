# models/index.ts

# File Path
`src/infrastructure/database/models/index.ts`

# Purpose
This is the barrel (aggregator) file for the `models` sub-module within the database infrastructure layer. It exposes the Mongoose user model and its associated document type through a single, controlled entry point so consumers do not need to import directly from `user.model.ts`. It is re-exported upward by `database/index.ts` and ultimately by the root `infrastructure/index.ts` barrel.

The file contains no logic — it only re-exports the model and type for the `User` collection.

# Responsibilities
- Re-export the `UserModel` (the compiled Mongoose model) as a value export.
- Re-export the `UserDocument` type as a type-only export.
- Provide the canonical import path `.../database/models` for data-model symbols.
- Establish the pattern that additional future models should follow (each model gets its own file plus an entry here).

# Dependencies

| Import | Path | Explanation |
| --- | --- | --- |
| `UserModel` (value re-export) | `./user.model` | The compiled Mongoose model for the `users` collection. |
| `UserDocument` (type re-export) | `./user.model` | The inferred document type for a user document, including `_id`, `createdAt`, `updatedAt`. |

Because these are re-exports, the module transitively loads `mongoose` (via `user.model.ts`). This barrel itself declares **no `import` statements** and no new code of its own.

# Exports
- `UserModel` — value export (the compiled Mongoose model, `Model<UserDocument>`).
- `UserDocument` — type-only export (the user document shape).

No new named exports, classes, constants, or symbols are declared here; it only forwards the two symbols from `./user.model`.

# Internal Functions
None. Pure barrel file.

# Execution Flow
1. The module evaluates `export { UserModel } from './user.model';`, which loads `src/infrastructure/database/models/user.model.ts` (constructing the schema and model) and registers `UserModel`.
2. The module evaluates `export type { UserDocument } from './user.model';`, registering the type.
3. Loading `user.model.ts` triggers the schema/model construction described in that file.
4. Module load completes; `UserModel` and `UserDocument` are now available from this barrel.

# Related Files
- `src/infrastructure/database/models/user.model.ts` — the actual implementation this barrel forwards.
- `src/infrastructure/database/index.ts` — parent barrel with `export * from './models'`, which forwards these symbols further.
- `src/infrastructure/index.ts` — root barrel that eventually exposes them.
- `src/infrastructure/repositories/user.repository.ts` — primary consumer of `UserModel` / `UserDocument`.

# Example Usage
```ts
import { UserModel, UserDocument } from './infrastructure/database/models';

const doc: UserDocument | null = await UserModel.findById('507f1f77bcf86cd799439011').lean();
```

# Best Practices
- Add every new model here so the rest of the app never imports model files by deep path.
- Keep type re-exports explicitly marked with `export type` to preserve type-erasure and tree-shaking friendliness.
- Follow the same one-file-per-model plus barrel-entry convention for new collections.

# Common Mistakes
- Forgetting to add a newly created model to this barrel, leaving it inaccessible via the standard path.
- Importing `UserModel` directly from `user.model.ts` elsewhere, bypassing the barrel and coupling consumers to internal structure.
- Confusing the barrel re-export with a re-creation of the model (the model instance is shared, not duplicated).

# Notes For Frontend Developers
- The frontend never imports this module; it receives user data over the HTTP API.
- The `UserModel`'s normalized fields — `email` (lowercased), `role` (enum), `isActive` — are exactly the field names and value cases you will consume in JSON payloads.
- If you add new persisted fields to the user in the future, they will appear in API responses only after both the schema and the API serialization layer are updated — the model alone won't change what the frontend sees.

---

## Function: (none)

This barrel file defines no functions or methods.
