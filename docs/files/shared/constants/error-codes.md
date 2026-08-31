# File Name
`error-codes.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\shared\constants\error-codes.js`

# Purpose
Defines the standard API error codes shared across the application. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Provide a frozen `ERROR_CODES` map of canonical error code strings.
- Give a single source of truth for codes used by custom errors and handlers.

# Exports
- `ERROR_CODES` — frozen object with `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`.

# Internal Functions
- None.

# Execution Flow
- Module load freezes and exports the constant map. No runtime flow.

# Related Files
- `src/shared/errors/custom-errors.js` — uses these codes (`NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`).
- `src/api/middlewares/error-handler.js` — emits `INTERNAL_ERROR` / `NOT_FOUND`.

# Example Usage
```javascript
const { ERROR_CODES } = require('../shared/constants/error-codes');
// ERROR_CODES.NOT_FOUND === 'NOT_FOUND'
```

# Values
- `NOT_FOUND` → `'NOT_FOUND'`
- `VALIDATION_ERROR` → `'VALIDATION_ERROR'`
- `CONFLICT` → `'CONFLICT'`
- `INTERNAL_ERROR` → `'INTERNAL_ERROR'`

# Best Practices
- Reference `ERROR_CODES` instead of hard-coding code strings.

# Common Mistakes
- Typing raw strings in error construction, allowing drift from canonical codes.

# Notes For Frontend Developers
- Error responses carry a `code` field matching one of these values — clients can branch on them.
