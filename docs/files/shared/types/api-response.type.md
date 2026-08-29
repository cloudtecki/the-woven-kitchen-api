# File Name
`api-response.type.ts`

# File Path
`src/shared/types/api-response.type.ts`

# Purpose
Defines the TypeScript contracts for all normalized API response envelopes used by the application's handlers and helpers. It centralizes the success, error, and paginated response shapes so both server code and generated client types stay aligned.

# Responsibilities
- Declare the base `ApiResponse` generic interface (success/error envelope).
- Declare the `PaginatedResponse` interface extending `ApiResponse` with a `pagination` block.
- Re-export `PaginatedResult` from the pagination type module for convenience.
- Provide the single source of truth for response typing used by `response.ts` helpers.

# Dependencies
- `./pagination.type` — re-exports `PaginatedResult<T>` (used as an alias and by pagination-related declarations).

# Exports
- `ApiResponse<T = unknown>` — interface with `success`, optional `data`, `message`, and `errors`.
- `PaginatedResponse<T>` — interface extending `ApiResponse<T[]>` and adding `pagination`.
- `PaginatedResult<T>` — re-exported alias from `./pagination.type`.

## Function: `ApiResponse<T>` (interface)
- Location: `src/shared/types/api-response.type.ts:1`
- Purpose: The generic base envelope for every JSON API response (both success and error).
- Parameters (type parameter):
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `T` | `unknown` (default) | No | The type of the `data` payload. |
- Return Type: Interface, not a function.
- Throws: N/A.
- Called By: `successResponse`, `errorResponse`, `paginatedResponse` helpers; consumer code typing responses.
- Calls: N/A.
- Execution Flow: N/A (type declaration only).
- Example Input: `ApiResponse<User>`.
- Example Output: type `{ success: boolean; data?: User; message?: string; errors?: Record<string, string \| string[]> }`.
- Business Logic: N/A.
- Edge Cases: `T` defaults to `unknown`; `data` is optional so error envelopes can omit it.
- Notes: `errors` values are either a single string or an array of strings, mirroring `ValidationError.errors`.

## Function: `PaginatedResponse<T>` (interface)
- Location: `src/shared/types/api-response.type.ts:8`
- Purpose: Represents a successful list response with pagination metadata, extending `ApiResponse<T[]>`.
- Parameters (type parameter):
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `T` | — | Yes | Element type of the paginated `data` array. |
- Return Type: Interface, not a function.
- Throws: N/A.
- Called By: `paginatedResponse` helper; client typing for list endpoints.
- Calls: N/A.
- Execution Flow: N/A (type declaration only).
- Example Input: `PaginatedResponse<User>`.
- Example Output: `{ success: boolean; data?: User[]; message?: string; errors?: ...; pagination: { page; limit; total; totalPages } }`.
- Business Logic: N/A.
- Edge Cases: `data` is `T[]`; `pagination` is required on this interface.
- Notes: `pagination` fields mirror `PaginatedResult` (`page`, `limit`, `total`, `totalPages`).

## Function: `PaginatedResult<T>` (type alias, re-exported)
- Location: `src/shared/types/api-response.type.ts:17` (re-export from `./pagination.type`)
- Purpose: Re-exports the `PaginatedResult<T>` interface so consumers can import it from the api-response module too.
- Parameters (type parameter): `T` — element type.
- Return Type: Interface `{ data: T[]; total; page; limit; totalPages }`.
- Throws: N/A.
- Called By: Repository/query layers producing paginated results; `paginatedResponse` consumer mapping.
- Calls: N/A.
- Execution Flow: N/A (type declaration).
- Example Input: `PaginatedResult<User>`.
- Example Output: `{ data: User[]; total: number; page: number; limit: number; totalPages: number }`.
- Business Logic: N/A.
- Edge Cases: N/A.
- Notes: See `pagination.type.ts` for full documentation.

# Internal Functions
None; this file contains only type/interface declarations and a re-export.

# Execution Flow
N/A — types are compile-time only; there is no runtime behavior.

# Related Files
- `src/shared/types/pagination.type.ts`
- `src/shared/utils/response.ts`
- `src/shared/index.ts`

# Example Usage
```ts
import { ApiResponse, PaginatedResponse, PaginatedResult } from '../../shared';

const result: PaginatedResult<User> = { data, total, page, limit, totalPages };
const body: PaginatedResponse<User> = { success: true, data: result.data, pagination: result };
```

# Best Practices
- Use `ApiResponse<T>` for all non-paginated endpoints and `PaginatedResponse<T>` for list endpoints.
- Keep `data` optional on the base type so both success and error envelopes use the same interface.
- Derive client type definitions from these shapes to keep frontend/backend contracts in sync.

# Common Mistakes
- Mixing paginated and non-paginated shapes (forgetting `pagination`).
- Assuming `data` is always present when handling errors (it is optional).
- Ignoring that `errors` values can be either a string or a string array.

# Notes For Frontend Developers
Standard client contracts:
- Success: `{ success: true, data?: T, message?: string }`.
- Error: `{ success: false, message: string, code?, errors? }` (errors keyed by field).
- Paginated: `{ success: true, data: T[], pagination: { page, limit, total, totalPages } }`.
Build a generic client response type mirroring `ApiResponse<T>` and a `PaginatedResponse<T>` for list endpoints.
