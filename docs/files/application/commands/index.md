# File Name

`index.ts` (commands barrel)

# File Path

`src/application/commands/index.ts`

# Purpose

Barrel module that aggregates and re-exports all user command classes from the application-layer command folder. It is consumed by the application root barrel (`src/application/index.ts`) and provides a single import entry point for the CQRS write-side message types.

# Responsibilities

- Re-export `CreateUserCommand`, `UpdateUserCommand`, `DeleteUserCommand` from their concrete file modules.
- Keep consumers decoupled from concrete file paths within the `commands` folder.
- Provide the write-side vocabulary of the CQRS application layer (create, update, delete).

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `./create-user.command` | relative module | Source of `CreateUserCommand`. Only the named export is referenced. |
| `./update-user.command` | relative module | Source of `UpdateUserCommand`. Only the named export is referenced. |
| `./delete-user.command` | relative module | Source of `DeleteUserCommand`. Only the named export is referenced. |

The barrel itself imports no runtime libraries.

# Exports

- `CreateUserCommand` — from `./create-user.command`
- `UpdateUserCommand` — from `./update-user.command`
- `DeleteUserCommand` — from `./delete-user.command`

# Internal Functions

None. The file contains only `export { ... } from ...` statements.

# Execution Flow

1. Module is imported (directly or via `src/application/index.ts`).
2. TypeScript resolves each `export { X } from './file'` request against the corresponding module.
3. The three command classes become available on the barrel's public namespace.
4. No runtime instantiation occurs at import time.

# Related Files

- `src/application/commands/create-user.command.ts` — the create command definition
- `src/application/commands/update-user.command.ts` — the update command definition
- `src/application/commands/delete-user.command.ts` — the delete command definition
- `src/application/index.ts` — re-exports this barrel
- `src/application/handlers/index.ts` — the matching handlers barrel (same import style)

# Example Usage

```ts
// Consumer imports once from the commands barrel
import { CreateUserCommand, UpdateUserCommand, DeleteUserCommand } from '../application/commands';

export function toCreateCommand(input) {
  return new CreateUserCommand(input.email, input.name, input.role);
}
```

# Best Practices

- Add every new command class to this barrel so the application root barrel stays complete.
- Keep exports purely unidirectional (no re-importing back into the concrete command files).
- Prefer named `export { X } from` over `export * from` when you want explicit control over the public surface.
- Keep the barrel free of logic.

# Common Mistakes

- Forgetting to register a newly created command here, causing seemingly random "not exported" errors at build/import time.
- Introducing command files that import from the barrel itself, creating circular dependency chains.
- Re-exporting internal helper types (non-command) from this barrel and polluting the public API.

# Notes For Frontend Developers

- Server-side only; you never touch this file.
- The practical consequence for you: the REST routes mirror these three verbs — `POST` (create), `PATCH`/`PUT` (update), `DELETE` (delete) — and each maps to exactly one command here.
- Error behavior you should code against: duplicates → 409 on create, missing resource → 404 on update/delete.