# File Name

`index.ts`

# File Path

`src/application/index.ts`

# Purpose

Barrel (index) module for the application layer of a Clean Architecture + CQRS TypeScript/Express/Mongoose backend. It re-exports everything public from the four application-layer sub-modules so that consumers (e.g. the presentation/API layer or the DI composition root) can import commands, queries, handlers, and DTOs from a single entry point.

# Responsibilities

- Provide a single, stable public API surface for the application layer.
- Re-export command classes (`commands`), query classes (`queries`), command/query handlers (`handlers`), and zod validation schemas plus inferred types (`dto`).
- Enable deep-import avoidance: consumer code imports from `src/application` instead of reaching into sub-folders.
- Keep the application layer self-contained and independently mockable/testable by exposing its public contract in one place.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `./commands` | relative module | Public barrel that re-exports `CreateUserCommand`, `UpdateUserCommand`, `DeleteUserCommand`. See `docs/files/application/commands/index.md` for details. |
| `./queries` | relative module | Public barrel that re-exports `GetUserByIdQuery`, `GetAllUsersQuery`. See `docs/files/application/queries/index.md` for details. |
| `./handlers` | relative module | Public barrel that re-exports `CreateUserHandler`, `UpdateUserHandler`, `DeleteUserHandler`, `GetUserByIdHandler`, `GetAllUsersHandler`. See `docs/files/application/handlers/index.md` for details. |
| `./dto` | relative module | Public barrel that re-exports zod schemas (`createUserSchema`, `updateUserSchema`, `userQuerySchema`, `userIdParamsSchema`) and their inferred TypeScript types. See `docs/files/application/dto/index.md` for details. |

Note: this module has no runtime logic. All imports are re-exported only; nothing is executed when `index.ts` is imported other than the module-level evaluation of the four re-export statements.

# Exports

- Everything exported by `./commands`:
  - `CreateUserCommand`
  - `UpdateUserCommand`
  - `DeleteUserCommand`
- Everything exported by `./queries`:
  - `GetUserByIdQuery`
  - `GetAllUsersQuery`
- Everything exported by `./handlers`:
  - `CreateUserHandler`
  - `UpdateUserHandler`
  - `DeleteUserHandler`
  - `GetUserByIdHandler`
  - `GetAllUsersHandler`
- Everything exported by `./dto`:
  - Values: `createUserSchema`, `updateUserSchema`, `userQuerySchema`, `userIdParamsSchema`
  - Types: `CreateUserInput`, `UpdateUserInput`, `UserQueryInput`, `UserIdParamsInput`

# Internal Functions

None. This file contains only TypeScript `export *` statements; there are no functions, classes, or constants defined locally.

# Execution Flow

1. Module is loaded (e.g. via `import { CreateUserCommand } from '../application'`).
2. TypeScript evaluates `export * from './commands'`.
3. TypeScript evaluates `export * from './queries'`.
4. TypeScript evaluates `export * from './handlers'`.
5. TypeScript evaluates `export * from './dto'`.
6. All named exports are aggregated onto the application module namespace.
7. No runtime side effects occur; nothing is instantiated at import time.

# Related Files

- `src/application/commands/index.ts` — source of command exports
- `src/application/queries/index.ts` — source of query exports
- `src/application/handlers/index.ts` — source of handler exports
- `src/application/dto/index.ts` — source of DTO schema/type exports
- `src/domain/*` — domain layer that the application layer orchestrates
- `src/presentation/*` (if present) — typical consumer of this barrel

# Example Usage

```ts
// Composition root / routing layer
import {
  CreateUserCommand,
  GetUserByIdQuery,
  CreateUserHandler,
  GetUserByIdHandler,
  createUserSchema,
  CreateUserInput,
} from '../application';

// Parse + validate an incoming request body
const input: CreateUserInput = createUserSchema.parse(req.body);

// Build a command (write side)
const command = new CreateUserCommand(input.email, input.name, input.role);

// Dispatch to a handler obtained from the DI container
const handler = container.get<CreateUserHandler>(TYPES.CreateUserHandler);
const user = await handler.execute(command);
```

# Best Practices

- Import from the barrel (`src/application`) rather than deep-importing from sub-paths, unless tree-shaking or circular-dependency concerns demand otherwise.
- Treat the barrel as a public contract; adding a new export here widens the application's API surface deliberately.
- Keep the four sub-barrels (`commands`, `queries`, `handlers`, `dto`) as the only sources so the root barrel stays a pure aggregator.
- Do not add runtime logic or side effects to this file — barrels should stay side-effect free to avoid import-time surprises.

# Common Mistakes

- Adding internal/private classes to the barrel, inadvertently expanding the public API.
- Introducing circular imports: if a handler imports from `src/application` instead of its concrete file, it can create an import cycle through the barrel.
- Placing logic directly in the barrel instead of the relevant sub-module, making the file hard to reason about.
- Forgetting that `export *` re-exports type-only exports as well, which can clash with `isolatedModules`/`verbatimModuleSyntax` settings if the types aren't re-exported properly.

# Notes For Frontend Developers

- This file is a server-side composition point and never ships to the browser. As a frontend developer you will not import it directly.
- What matters to you is the API contract it exposes: the endpooint bodies are validated by the exported zod schemas (`createUserSchema`, `updateUserSchema`, `userQuerySchema`, `userIdParamsSchema`) and query parameters like `page`/`limit` are coerced into numbers server-side.
- When you call the backend, expect shapes matching those schemas (e.g. `{ email, name, role }` for create-user) and pagination params `page` (default 1) and `limit` (default 20) for list endpoints — see `userQuerySchema` in `src/application/dto/user.dto.ts`.
- Responses for lists include pagination metadata (`data`, `total`, `page`, `limit`, `totalPages`); handle these fields instead of assuming a bare array.