# Folder: shared

# Path: src/shared/

# Purpose

The **shared** folder holds cross-cutting concerns — small, reusable pieces that many layers rely on but are not themselves a layer: constants, error classes, and utility helpers. It is deliberately framework-light (pure JavaScript + winston) and acts as a "utility belt" so the same helper is defined once and used everywhere.

There is **no middleware** sub-folder here (middlewares live in `api/middlewares/`), **no types** (the project is plain JavaScript, no TypeScript), and **no DI tokens** (no dependency injection container).

# Responsibilities

- **Constants** (`constants/`): The `ERROR_CODES` frozen object — standard API error code strings (`NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`) shared across the application.
- **Errors** (`errors/`): A hierarchy of application errors built on the `AppError` base class. Custom errors include `NotFoundError` (404), `ValidationError` (400), `ConflictError` (409), and `InternalError` (500). Each carries a `statusCode`, `code`, `isOperational` flag, and optional `details`.
- **Utils** (`utils/`): `asyncHandler` (wraps async route handlers so rejections reach the error handler), `response` helpers (`successResponse`, `createdResponse`, `noContentResponse`, `errorResponse`, `paginatedResponse`), and `logger` (the winston logger with dev/prod format switching).

# Why this folder exists

In Clean Architecture, cross-cutting infrastructure (logging, errors, response helpers) should not belong to any single layer — it is shared by many. Consolidating it in `shared/` keeps `api`, `application`, `domain`, and `infrastructure` free of duplicated boilerplate and gives one obvious home for "common stuff." It also enforces consistency: every controller uses the same response helpers, every error uses the same base class, and every error is handled the same way.

# What files belong here

```
shared/
├── constants/
│   └── error-codes.js           # ERROR_CODES frozen object
├── errors/
│   ├── app-error.js             # AppError base class (statusCode, code, isOperational, details)
│   ├── custom-errors.js         # NotFoundError, ValidationError, ConflictError, InternalError
│   └── index.js                 # Barrel re-export
└── utils/
    ├── async-handler.js         # asyncHandler — wraps async fn so rejections go to next()
    ├── logger.js                # winston logger (JSON in prod, colorized in dev)
    ├── response.js              # successResponse, createdResponse, noContentResponse,
    │                            #   errorResponse, paginatedResponse
    └── index.js                 # Barrel re-export
```

# Which layer depends on it

Almost **every layer** depends on `shared`, because it provides the atoms they all compose:

- `api/routes` — `asyncHandler`, error classes (via `validate.js`)
- `api/middlewares` — `AppError` (in `error-handler.js`), `logger`, `ValidationError` (in `validate.js`)
- `app.js` — `requestLogger`, `errorHandler`, `notFoundHandler` (from `api/middlewares`, which use `shared`)
- `server.js` — `logger`
- `infrastructure/database/mongoose/connection.js` — `logger`

Future dependencies:
- `api/controllers` — `asyncHandler`, response helpers
- `application/handlers` — error classes (e.g. `ConflictError`)

`shared` itself depends on only `config` (for the logger) plus external libraries — never on `api`, `application`, `domain`, or `infrastructure`.

# Which layer should NOT depend on it

- Nothing at the app-layer level is forbidden from using `shared`, but the reverse must hold: **`shared` must not import** `api`, `application`, `domain`, or `infrastructure`. It has no valid reason to, since it provides only generic helpers.

# Flow

```
App assembly (app.js):
  app.use(requestLogger)          # from api/middlewares (uses shared/utils/logger)
  app.use('/api', router)         # routes use asyncHandler, validate
  app.use(notFoundHandler)        # from api/middlewares
  app.use(errorHandler)           # from api/middlewares (uses shared/errors)

Request lifecycle:
  validate ──(fail)──► next(new ValidationError()) ──► errorHandler
  asyncHandler catches rejected promises ──► errorHandler
  response helpers build the { success, data } / { success, message, code } envelope
```

Errors thrown by any handler (e.g. `ConflictError`) propagate to `errorHandler` (`api/middlewares/error-handler.js`), which reads `err.statusCode`, `err.code`, `err.isOperational`, and `err.details` to return a consistent JSON error body.

# Example

Route handlers use `asyncHandler` and respond with shared helpers:

```js
const { asyncHandler } = require('../../shared/utils/async-handler');

router.get('/health', asyncHandler(async (req, res) => {
  res.status(200).json({ status: 'OK' });
}));
```

Error classes are thrown from anywhere and caught by the error handler:

```js
const { ConflictError } = require('../../shared/errors');

throw new ConflictError('User with this email already exists');
// errorHandler responds: { success: false, message: '...', code: 'CONFLICT' }
```

Response helpers produce a standard envelope:

```js
const { successResponse, paginatedResponse } = require('../../shared/utils/response');

successResponse(res, user);                                     // { success: true, data: user }
paginatedResponse(res, data, { page, limit, total, totalPages });
```

# Related Folders

- `docs/folders/api.md` — routes/middlewares that consume `asyncHandler`, errors, and response helpers.
- `docs/folders/infrastructure.md` — the `connection.js` uses `logger`.
- `docs/folders/config.md` — the logger reads `config.nodeEnv` / `config.logLevel`.
