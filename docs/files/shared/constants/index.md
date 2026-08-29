# File Name
`index.ts` (constants barrel)

# File Path
`src/shared/constants/index.ts`

# Purpose
Provides the public entry point for the shared constants module. It re-exports the dependency-injection token container (`TYPES`) so that the IoC container's symbol identifiers are available from a single, consistent location.

# Responsibilities
- Aggregate shared constants into a single import surface.
- Expose the `TYPES` object holding `Symbol.for(...)` DI bindings.
- Keep the IoC token definitions discoverable and documented in one place.

# Dependencies
- `./tokens` — Contains the `TYPES` constant object that defines all dependency injection symbols (`export { TYPES } from './tokens'`).

# Exports
Aggregation module re-exporting:
- `TYPES` — The object (typed `as const`) whose keys are DI container tokens mapping to `Symbol.for(...)` symbols (e.g. `UserRepository`, `CreateUserHandler`, etc.).

# Internal Functions
None. Pure re-export barrel.

# Execution Flow
1. Module load resolves the `./tokens` module.
2. The `TYPES` object is re-bound and made available to importers.

# Related Files
- `src/shared/constants/tokens.ts`
- `src/shared/index.ts`

# Example Usage
```ts
import { TYPES } from '../../shared/constants';
// or using the barrel:
import { TYPES } from '../../shared';

container.bind(TYPES.UserRepository).to(UserRepository);
```

# Best Practices
- Keep the tokens centralised here so container wiring uses only shared tokens.
- Prefer importing through the `constants` barrel or shared barrel instead of `tokens.ts` directly.

# Common Mistakes
- Importing `tokens.ts` directly by deep path instead of through the barrel.
- Defining/overriding token strings inline in container files instead of using `TYPES`.

# Notes For Frontend Developers
Server-internal only. `TYPES` symbols are never exposed over HTTP; they are purely for the server-side Inversion-of-Control container wiring and have no effect on API payloads.
