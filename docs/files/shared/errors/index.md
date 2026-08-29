# File Name
`index.ts` (errors barrel)

# File Path
`src/shared/errors/index.ts`

# Purpose
The barrel file for the shared error module. It re-exports the `AppError` base class and every concrete application error class so consumers can import any error from a single location.

# Responsibilities
- Aggregate all error classes into one import surface.
- Provide named re-exports of every error type.
- Act as the documented listing of every available error class.

# Dependencies
- `./app-error.base` — exports `AppError`.
- `./not-found.error` — exports `NotFoundError`.
- `./validation.error` — exports `ValidationError`.
- `./unauthorized.error` — exports `UnauthorizedError`.
- `./forbidden.error` — exports `ForbiddenError`.
- `./conflict.error` — exports `ConflictError`.
- `./internal.error` — exports `InternalError`.

# Exports
Named re-exports:
- `AppError` — abstract base error class.
- `NotFoundError` — 404 error.
- `ValidationError` — 400 error with a field-level `errors` map.
- `UnauthorizedError` — 401 error.
- `ForbiddenError` — 403 error.
- `ConflictError` — 409 error.
- `InternalError` — 500 non-operational error.

# Internal Functions
None. Pure re-export barrel.

# Execution Flow
1. Module load resolves each of the seven sub-modules.
2. Each class is re-bound and re-exported by the barrel.

# Related Files
- Every file under `src/shared/errors/`.
- `src/shared/index.ts` (re-exports this barrel).

# Example Usage
```ts
import { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError, InternalError, AppError } from '../../shared/errors';
```
From the shared barrel: `import { NotFoundError } from '../../shared';`

# Best Practices
- Import errors from this barrel (or the shared barrel) rather than deep paths.
- Keep this file a pure aggregation with no logic.

# Common Mistakes
- Deep-importing individual error files.
- Adding runtime logic to the barrel.

# Notes For Frontend Developers
The error `code` values (`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`, `INTERNAL_ERROR`) are the stable machine-readable identifiers the server emits in error bodies. Mirror these in the client's API error typing for consistent handling.
