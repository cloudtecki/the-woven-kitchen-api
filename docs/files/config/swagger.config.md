# File Name
swagger.config.ts

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\config\swagger.config.ts`

# Purpose
Builds and exports the OpenAPI 3.0 specification (Swagger document) for the backend using `swagger-jsdoc`. It defines static OpenAPI metadata (info, servers, security schemes, and reusable component schemas) and points the tool at the source files containing inline JSDoc `@swagger` annotations so that endpoint definitions are auto-discovered and merged into the final spec.

# Responsibilities
- Define the `swaggerJsdoc.Options` object with a static `definition` and an `apis` glob array.
- Specify OpenAPI metadata: version `3.0.0`, title `TWK Admin API`, version `1.0.0`, and description.
- Declare two development server URLs derived from `config.port` and `config.apiPrefix`.
- Define reusable `components`:
  - `securitySchemes.bearerAuth` — HTTP `bearer` JWT security scheme.
  - `schemas.User` — object schema for a user record.
  - `schemas.ApiError` — object schema for a generic API error payload.
  - `schemas.ValidationError` — object schema for a validation error payload.
- Configure `apis` to scan `./src/api/routes/*.ts`, `./src/api/controllers/*.ts`, and `./src/app.ts` for inline `@swagger` JSDoc annotations.
- Generate and export the final `swaggerSpec` via `swaggerJsdoc(options)`.

# Dependencies
- `swagger-jsdoc` (default import): Reads the provided options and scans the `apis` globs, merging JSDoc annotations into a single OpenAPI document. Its `Options` type is used for typing `options`.
- `./index` (named export `config`): Provides `config.port` and `config.apiPrefix` used to build the server URLs in the definition.

# Exports
- `swaggerSpec` — the generated OpenAPI 3.0 specification object (named export).

# Internal Functions
- None. `swagger.config.ts` executes module-level logic and exports the generated spec; there are no named/internal functions.

# Execution Flow
1. Import `config` to obtain port and API prefix.
2. Build the `options` object:
   - `definition.openapi` = `'3.0.0'`.
   - `definition.info` contains title, version, and description.
   - `definition.servers` lists two dev URLs (`/api/v1`-prefixed and root).
   - `definition.components.securitySchemes.bearerAuth` defines a bearer JWT scheme.
   - `definition.components.schemas` defines `User`, `ApiError`, `ValidationError`.
3. Set `apis` globs covering routes, controllers, and `app.ts`.
4. Call `swaggerJsdoc(options)` at module load.
5. Export the resulting `swaggerSpec`.

# Related Files
- `src/config/index.ts` — supplies `config.port` and `config.apiPrefix`.
- `src/app.ts` — consumes `swaggerSpec` via `swaggerUi.setup(swaggerSpec, ...)` to render the docs UI at `/api/docs`.
- `src/api/controllers/user.controller.ts` — contains `@swagger` JSDoc annotations that get merged into the spec.
- `src/app.ts` (health route) — contains `@swagger` JSDoc for the `/health` endpoint.
- Any route files scanned by the `apis` globs.

# Example Usage
```typescript
import { swaggerSpec } from './config/swagger.config';
import swaggerUi from 'swagger-ui-express';

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'TWK Admin API',
}));
```

# Best Practices
- Centralize the OpenAPI definition here so all Swagger concerns live in one config file.
- Define reusable component schemas (`User`, `ApiError`, `ValidationError`) instead of duplicating them per endpoint, keeping the spec DRY.
- Define a bearer security scheme so authenticated endpoints can declare that they require JWT auth.
- Keep the `apis` globs aligned with the actual directory layout so `@swagger` annotations are reliably discovered.
- Derive server URLs from config rather than hardcoding, so ports/prefixes stay in sync.

# Common Mistakes
- Using glob patterns that don't match the actual source layout, causing endpoints to be missing from the docs.
- Hardcoding server URLs instead of using `config`, so docs point at the wrong port/prefix after config changes.
- Forgetting to scan `app.ts` for the `/health` endpoint annotation.
- Defining overlapping/non-matching schema names that cause merge conflicts or missing references.
- Not importing `reflect-metadata` early (in `server.ts`) when the spec depends on DI-related metadata — not needed here, but relevant to overall build order.

# Notes For Frontend Developers
- Live API documentation is available at `/api/docs` once the server runs; it lists endpoints, request/response schemas, and the bearer JWT security scheme.
- The `User` schema (id, email, name, role in `ADMIN|MANAGER|STAFF`, `isActive`, timestamps) documents the shape of user resources frontends can expect.
- `ApiError` and `ValidationError` schemas describe the error payload shape, including `code` (e.g., `VALIDATION_ERROR`) and a per-field array of messages — useful for building API client error handling.
- Docs are versioned (`1.0.0`) and served under the `/api/docs` path, distinct from the API itself which is under `/api` or `/api/v1` depending on `API_PREFIX`.
