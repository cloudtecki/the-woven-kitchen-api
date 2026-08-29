# File Name

`index.ts` (dto barrel)

# File Path

`src/application/dto/index.ts`

# Purpose

Barrel module that aggregates and re-exports the user DTO validation schemas and their inferred types. It is consumed by the application root barrel (`src/application/index.ts`) and provides a single import entry point for the application layer's request contracts.

# Responsibilities

- Re-export the four zod schemas: `createUserSchema`, `updateUserSchema`, `userQuerySchema`, `userIdParamsSchema`.
- Re-export the four inferred type definitions: `CreateUserInput`, `UpdateUserInput`, `UserQueryInput`, `UserIdParamsInput` (as `type` re-exports).
- Keep consumers decoupled from the concrete `user.dto.ts` file.
- Provide typed and runtime-validated contracts under one namespace.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `./user.dto` | relative module | Source of all schemas and types. Only the named exports are referenced. |

The barrel itself imports no external libraries.

# Exports

Values:
- `createUserSchema` — create-user body schema
- `updateUserSchema` — update-user body schema
- `userQuerySchema` — pagination query schema
- `userIdParamsSchema` — id route-param schema

Type-only re-exports:
- `CreateUserInput`
- `UpdateUserInput`
- `UserQueryInput`
- `UserIdParamsInput`

# Internal Functions

None. The file contains only `export { ... } from './user.dto'` statements.

# Execution Flow

1. Module is imported (directly or via `src/application/index.ts`).
2. TypeScript resolves each `export { X } from './user.dto'` against `user.dto.ts`.
3. The four schemas (values) and four types become available on the barrel's namespace.
4. The schemas are constructed exactly once (at `user.dto.ts` module evaluation) and shared.

# Related Files

- `src/application/dto/user.dto.ts` — the actual schema/type definitions
- `src/application/index.ts` — re-exports this barrel
- `src/application/commands/*.ts` — consumers of the exported schemas/types
- `src/application/queries/*.ts` — consumers of pagination/id schemas
- `src/domain/value-objects/user-role.ts` — enum used inside `role` validation

# Example Usage

```ts
import { createUserSchema, CreateUserInput } from '../application/dto';

const input: CreateUserInput = createUserSchema.parse(req.body);
```

# Best Practices

- Always re-export the inferred types with an explicit `type` keyword so TypeScript can elide them under `isolatedModules`/`verbatimModuleSyntax`.
- Register every new schema/type here; keep the barrel, not `user.dto.ts`, as the import target.
- Keep the ordering stable (schemas, then types) to make diffs readable.
- Keep this barrel free of logic.

# Common Mistakes

- Re-exporting types without the `type` modifier, which can emit unused runtime imports under strict compiler settings.
- Importing directly from `user.dto.ts` in many places and leaving consumers to disagree about the canonical import path.
- Adding non-DTO helpers to this barrel and mixing concerns.

# Notes For Frontend Developers

- Server-side contract centralization — you never import this file.
- The practical contract for you is described in `docs/files/application/dto/user.dto.md`: request bodies, query params, and the error messages you may display (email/name/id messages are defined there).