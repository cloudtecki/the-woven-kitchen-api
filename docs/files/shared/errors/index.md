# File Name
`index.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\shared\errors\index.js`

# Purpose
Barrel file for the shared errors module. It re-exports `AppError` and all custom error classes from a single import surface. Plain JavaScript (CommonJS — `module.exports`).

# Responsibilities
- Aggregate and re-export error classes.
- Provide a single import path for `AppError`, `NotFoundError`, `ValidationError`, `ConflictError`, `InternalError`.

# Exports
- `AppError`
- `NotFoundError`
- `ValidationError`
- `ConflictError`
- `InternalError`

# Internal Functions
- None (pure re-export barrel).

# Execution Flow
- Module load imports from `./app-error` and `./custom-errors` and re-exports the named classes.

# Related Files
- `src/shared/errors/app-error.js`
- `src/shared/errors/custom-errors.js`
- `src/api/middlewares/error-handler.js`, `src/api/middlewares/validate.js` — consumers.

# Example Usage
```javascript
const { AppError, NotFoundError, ValidationError } = require('../shared/errors');
```

# Best Practices
- Import errors from this barrel rather than deep paths.
- Keep this file a pure aggregation.

# Common Mistakes
- Deep-importing individual error files.
- Adding logic to the barrel.

# Notes For Frontend Developers
- These error classes drive the HTTP status codes and `code` values seen in API error responses.
