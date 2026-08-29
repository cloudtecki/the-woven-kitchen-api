# Folder: shared

# Path: src/shared

# Purpose

The **shared** folder holds cross-cutting concerns — small, reusable pieces that many layers rely on but are not themselves a layer: constants, error classes, HTTP middleware, shared response/type contracts, and utility helpers. It is deliberately framework-light (mostly pure TypeScript + a couple of well-known libraries like winston and jsonwebtoken) and acts as a "utility belt" so the same helper is defined once and used everywhere.

# Responsibilities

- **Constants** (`constants/`): The `TYPES` object — Symbol tokens used by the DI container and by every `@inject()` decorator across handlers/repositories.
- **Errors** (`errors/`): A hierarchy of application errors built on the `AppError` base class (`NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `InternalError`), each carrying a `statusCode`, `code`, and `isOperational` flag. Plus the barrel `index.ts`.
- **Middleware** (`middleware/`): Express middleware — `auth` (JWT auth + role authorization), `error-handler` (centralized error + 404 handling), `request-logger` (structured request logging), and `validate` (zod schema validation for body/query/params).
- **Utils** (`utils/`): `asyncHandler` (wraps async controllers so rejections reach the error handler), `response` (success/created/paginated/error response helpers), and `logger` (the winston logger).
- **Types** (`types/`): Shared TypeScript contracts — `ApiResponse`, `PaginatedResponse`, and `PaginatedResult` that standardize the JSON shapes returned to clients.

# Why this folder exists

In Clean Architecture, cross-cutting infrastructure (logging, errors, auth, validation glue) should not belong to any single layer — it is shared by many. Consolidating it in `shared/` keeps `api`, `application`, `domain`, and `infrastructure` free of duplicated boilerplate and gives one obvious home for "common stuff." It also enforces consistency: every controller uses the same response helpers, every error uses the same base class, and every request is validated the same way.

# What files belong here

```
shared/
├── constants/
│   ├── tokens.ts                # TYPES symbols (IUserRepository, each Handler, ...)
│   └── index.ts
├── errors/
│   ├── app-error.base.ts        # abstract AppError
│   ├── conflict.error.ts        # ConflictError
│   ├── forbidden.error.ts       # ForbiddenError
│   ├── internal.error.ts        # InternalError
│   ├── not-found.error.ts       # NotFoundError
│   ├── unauthorized.error.ts    # UnauthorizedError
│   ├── validation.error.ts      # ValidationError
│   └── index.ts
├── middleware/
│   ├── auth.middleware.ts       # authenticate + authorize
│   ├── error-handler.middleware.ts  # errorHandler + notFoundHandler
│   ├── request-logger.middleware.ts # requestLogger
│   ├── validate.middleware.ts   # validate(schema, source)
│   └── index.ts
├── types/
│   ├── api-response.type.ts     # ApiResponse, PaginatedResponse
│   └── pagination.type.ts       # PaginatedResult
└── utils/
    ├── async-handler.ts
    ├── logger.ts                # winston logger
    ├── response.ts              # success/created/paginated/error helpers
    └── index.ts
```

# Which layer depends on it

Almost **every layer** depends on `shared`, because it provides the atoms they all compose:

- `api/controllers` — `asyncHandler`, response helpers, `TYPES`.
- `api/routes` — `validate` middleware and DTOs.
- `application/handlers` — `TYPES` (for `@inject`) and error classes (e.g. `ConflictError`).
- `infrastructure/*` — `TYPES`, `logger`.
- `config` is *not* depended on by `shared`, but `shared` (logger) imports `config`.

`shared` itself depends on only `config` (for the logger) plus external libraries — never on `api`, `application`, `domain`, or `infrastructure`.

# Which layer should NOT depend on it

- Nothing at the app-layer level is forbidden from using `shared`, but the reverse must hold: **`shared` must not import** `api`, `application`, `domain`, or `infrastructure`. It has no valid reason to, since it provides only generic helpers.
- `shared/types` should only contain pure TypeScript types (no runtime imports of app code) so they remain trivial to consume everywhere.

# Flow

```
App assembly (app.ts):
  app.use(requestLogger)          # shared/middleware
  app.use('/api', router)         # routes use validate(schema, source)
  app.use(notFoundHandler)        # shared/middleware
  app.use(errorHandler)           # shared/middleware

Request lifecycle:
  validate ──(fail)──► next(new ValidationError()) ──► errorHandler
  controller ──► asyncHandler catches rejections ──► errorHandler
  response helpers build the ApiResponse/PaginatedResponse envelope
```

Errors thrown by any handler (e.g. `ConflictError`) propagate to `errorHandler` (shared/middleware), which reads `err.statusCode`/`err.toJSON()` and returns a uniform JSON error body.

# Example

`api/controllers` rely on shared helpers to emit a standard envelope. For a successful read:

```ts
successResponse(res, user);                     // { success: true, data: user }
paginatedResponse(res, data, { page, limit, total, totalPages });
```

And on failure, a handler throws a shared error that the shared error-handler formats:

```ts
throw new ConflictError('User with this email already exists');
// errorHandler responds: { status:'error', message:'...', code:'CONFLICT_ERROR', ... }
```

# Related Folders

- `docs\folders\api.md` — routes/controllers that consume `validate`, `asyncHandler`, responses.
- `docs\folders\application.md` — handlers that throw shared errors and use `TYPES`.
- `docs\folders\infrastructure.md` — DI container and logger depend on `TYPES` / `logger`.
- `docs\folders\config.md` — `logger` and `auth.middleware` read configuration.
