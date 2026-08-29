# File Name
`pagination.type.ts`

# File Path
`src/shared/types/pagination.type.ts`

# Purpose
Defines the `PaginatedResult<T>` interface representing a paginated data set returned by repository/query layers. It provides the canonical shape used both internally (data plus pagination metadata) and as the basis for the HTTP `PaginatedResponse` envelope.

# Responsibilities
- Declare the `PaginatedResult<T>` interface describing one page of results with metadata.
- Standardize the fields `data`, `total`, `page`, `limit`, and `totalPages` for all paginated queries.
- Act as the source contract for the `paginatedResponse` helper and the `PaginatedResponse` type.

# Dependencies
No imports; the file is self-contained.

# Exports
- `PaginatedResult<T>` — interface `{ data: T[]; total: number; page: number; limit: number; totalPages: number }`.

## Function: `PaginatedResult<T>` (interface)
- Location: `src/shared/types/pagination.type.ts:1`
- Purpose: Describe a single page of results together with the pagination metadata needed by clients.
- Parameters (type parameter):
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `T` | — | Yes | The element type of the `data` array. |
- Return Type: Interface, not a function.
- Throws: N/A.
- Called By: Repository/query-layer methods that return paged data; `paginatedResponse` helper; `PaginatedResponse` interface.
- Calls: N/A.
- Execution Flow: N/A (type declaration only).
- Example Input: `PaginatedResult<User>`.
- Example Output: type `{ data: User[]; total: number; page: number; limit: number; totalPages: number }`.
- Business Logic: N/A.
- Edge Cases:
  - `totalPages` for an empty result set is typically `0`; the producer should compute it consistently (e.g. `Math.ceil(total / limit)`).
  - `page` is 1-based; `limit` is the max items per page.
- Notes: Fields `total`, `page`, `limit`, `totalPages` are all `number`.

# Internal Functions
None; this file contains only a type/interface declaration.

# Execution Flow
N/A — types are compile-time only.

# Related Files
- `src/shared/types/api-response.type.ts` (re-exports this and mirrors fields in `PaginatedResponse`)
- `src/shared/utils/response.ts` (`paginatedResponse` uses the same `pagination` shape)

# Example Usage
```ts
import type { PaginatedResult } from '../../shared/types/pagination.type';

// Producer
const result: PaginatedResult<User> = {
  data: users,
  total: 120,
  page: 1,
  limit: 10,
  totalPages: 12,
};
```

# Best Practices
- Use `PaginatedResult<T>` as the return type for any repository/query that pages results.
- Compute and populate all five fields consistently at the producer boundary.

# Common Mistakes
- Omitting `totalPages`, or computing it inconsistently with `total`/`limit`.
- Using 0-based `page` indices when clients expect 1-based.

# Notes For Frontend Developers
A paginated endpoint responds with `paginate` metadata equals to `{ page, limit, total, totalPages }`:
- `page` is 1-based (first page is `1`).
- `limit` is the page size.
- `total` is the full record count across all pages.
- `totalPages = ceil(total / limit)`.
Use these to build pagination controls and derive "previous/next" availability from `page` vs `totalPages`.
