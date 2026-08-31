# File Name
`index.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\shared\utils\index.js`

# Purpose
Barrel file for the shared utilities module. It re-exports `asyncHandler` and all response helpers so application code can import utility functions from a single location. Plain JavaScript (CommonJS — `module.exports` with spread requires).

# Responsibilities
- Aggregate shared utility functions into one import surface.
- Re-export `asyncHandler` and the response helpers.

# Exports
- `asyncHandler` — from `./async-handler`.
- `successResponse`, `createdResponse`, `noContentResponse`, `errorResponse`, `paginatedResponse` — from `./response`.

# Internal Functions
- None (pure re-export barrel).

# Execution Flow
- Module load pulls `asyncHandler` explicitly and spreads the exports of `./response` into the exported object.

# Related Files
- `src/shared/utils/async-handler.js`
- `src/shared/utils/response.js`

# Example Usage
```javascript
const { asyncHandler, successResponse, errorResponse } = require('../shared/utils');
```

# Best Practices
- Import utilities from this barrel rather than deep paths.
- Keep this file a pure aggregation with no logic.

# Common Mistakes
- Deep-importing individual utility files.
- Adding runtime logic to the barrel.

# Notes For Frontend Developers
- These helpers define the JSON envelopes the server produces (see `response.md`).
