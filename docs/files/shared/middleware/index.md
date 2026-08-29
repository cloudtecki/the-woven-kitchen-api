# File Name
`index.ts` (middleware barrel)

# File Path
`src/shared/middleware/index.ts`

# Purpose
The barrel file for the shared middleware module. It re-exports all shared Express middleware from a single location so application code (routes, app bootstrap) can import them without deep paths.

# Responsibilities
- Aggregate all shared middleware into one import surface.
- Re-export `errorHandler`, `notFoundHandler`, `validate`, `authenticate`, `authorize`, and `requestLogger`.
- Act as the documented listing of available middleware.

# Dependencies
- `./error-handler.middleware` — exports `errorHandler`, `notFoundHandler`.
- `./validate.middleware` — exports `validate`.
- `./auth.middleware` — exports `authenticate`, `authorize` (and `JwtPayload` type, though not re-exported here).
- `./request-logger.middleware` — exports `requestLogger`.

# Exports
Named re-exports:
- `errorHandler` — global error-handling middleware.
- `notFoundHandler` — 404 fallback middleware.
- `validate` — Zod schema-validation middleware factory.
- `authenticate` — JWT authentication middleware.
- `authorize` — role-based authorization middleware factory.
- `requestLogger` — request/response logging middleware.

# Internal Functions
None. Pure re-export barrel.

# Execution Flow
1. Module load resolves each sub-module.
2. Each middleware is re-bound and re-exported by the barrel.

# Related Files
- Every file under `src/shared/middleware/`.
- `src/shared/index.ts` (re-exports this barrel).

# Example Usage
```ts
import { errorHandler, notFoundHandler, validate, authenticate, authorize, requestLogger } from '../../shared/middleware';
// or from the shared barrel:
import { errorHandler } from '../../shared';
```

# Best Practices
- Import middleware from this barrel (or the shared barrel) rather than deep paths.
- Keep this file a pure aggregation with no logic.

# Common Mistakes
- Deep-importing individual middleware files.
- Adding runtime logic to the barrel.

# Notes For Frontend Developers
These middleware are server-internal. The only observable effects for the client are: `requestLogger` adds structured server logs, `validate`→400 `VALIDATION_ERROR` with `errors`, `authenticate`→401, `authorize`→403, `notFoundHandler`→404 `NOT_FOUND`, and `errorHandler` standardized error envelopes.
