# File Name
`index.ts` (utils barrel)

# File Path
`src/shared/utils/index.ts`

# Purpose
The barrel file for the shared utilities module. It re-exports the async-handler wrapper and all response helpers so application code can import utility functions from a single location.

# Responsibilities
- Aggregate shared utility functions into one import surface.
- Re-export `asyncHandler` and the response helpers.
- Act as the documented listing of available utilities.

# Dependencies
- `./async-handler` — exports `asyncHandler`.
- `./response` — exports `successResponse`, `createdResponse`, `noContentResponse`, `errorResponse`, `paginatedResponse`.

# Exports
Named re-exports:
- `asyncHandler` — wraps async route handlers to forward rejections.
- `successResponse` — writes a 200-ish success JSON body.
- `createdResponse` — writes a 201 created JSON body.
- `noContentResponse` — writes a 204 empty response.
- `errorResponse` — writes an error JSON body.
- `paginatedResponse` — writes a paginated success JSON body.

# Internal Functions
None. Pure re-export barrel.

# Execution Flow
1. Module load resolves `./async-handler` and `./response`.
2. Each utility is re-bound and re-exported by the barrel.

# Related Files
- `src/shared/utils/async-handler.ts`
- `src/shared/utils/response.ts`
- `src/shared/index.ts` (re-exports this barrel)

# Example Usage
```ts
import { asyncHandler, successResponse, createdResponse, noContentResponse, errorResponse, paginatedResponse } from '../../shared/utils';
// or from the shared barrel:
import { successResponse } from '../../shared';
```

# Best Practices
- Import utilities from this barrel (or the shared barrel) rather than deep paths.
- Keep this file a pure aggregation with no logic.

# Common Mistakes
- Deep-importing individual utility files.
- Adding runtime logic to the barrel.

# Notes For Frontend Developers
These helpers define the exact JSON envelopes the server produces. `successResponse` → `{ success: true, data, message? }`; `errorResponse` → `{ success: false, message, errors? }`; `paginatedResponse` → `{ success: true, data: T[], pagination: {...} }`. Mirror these in the client's response types.
