# File Name
`response.ts`

# File Path
`src/shared/utils/response.ts`

# Purpose
Provides a set of small, typed helper functions that standardize how Express handlers write JSON responses. They enforce the `ApiResponse` / `PaginatedResponse` envelopes for success, created, no-content, error, and paginated responses so that all endpoints return consistent shapes.

# Responsibilities
- Write standardized success / created / no-content / error / paginated JSON responses.
- Enforce the shared `ApiResponse<T>` and `PaginatedResponse<T>` envelopes.
- Reduce boilerplate and prevent inconsistent response shapes across controllers/handlers.
- Use appropriate HTTP status codes (200/201/204/5xx and paginated 200).

# Dependencies
- `express` — `Response` type.
- `../types/api-response.type` — `ApiResponse`, `PaginatedResponse` types used to shape bodies.

# Exports
- `successResponse` — generic success response (default 200).
- `createdResponse` — 201 created response.
- `noContentResponse` — 204 no-content response.
- `errorResponse` — error response (default 500).
- `paginatedResponse` — paginated success response (200).

## Function: successResponse
- Location: `src/shared/utils/response.ts:4`
- Purpose: Send a generic success response with an optional message, defaulting to HTTP 200.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `res` | `Response` | Yes | Express response to write to. |
  | `data` | `T` | Yes | The payload to include in `body.data`. |
  | `message` | `string` | No | Optional success message. |
  | `statusCode` | `number` | No (default `200`) | HTTP status code to send. |
- Return Type: `void`.
- Throws: Nothing.
- Called By: Route/command/query handlers producing successful results.
- Calls:
  - `res.status(statusCode).json(body)`.
- Execution Flow:
  1. Build `body: ApiResponse<T> = { success: true, data, ...(message && { message }) }`.
  2. `res.status(statusCode).json(body)`.
- Example Input: `successResponse(res, { id: '1' }, 'Created ok')`.
- Example Output: `res.status(200).json({ success: true, data: { id: '1' }, message: 'Created ok' })`.
- Business Logic: Standardizes the success envelope, omitting `message` when undefined.
- Edge Cases:
  - `message` is conditionally spread, so it is absent (not `null`) when not provided.
  - `statusCode` can be overridden for custom success codes.
- Notes: `data` is typed by `T` inferred from the call site.

## Function: createdResponse
- Location: `src/shared/utils/response.ts:18`
- Purpose: Send a 201 Created response by delegating to `successResponse`.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `res` | `Response` | Yes | Express response. |
  | `data` | `T` | Yes | The created resource payload. |
  | `message` | `string` | No | Optional success message. |
- Return Type: `void`.
- Throws: Nothing.
- Called By: Handlers that create a resource.
- Calls: `successResponse(res, data, message, 201)`.
- Execution Flow: Delegate to `successResponse` with a hard-coded `201`.
- Example Input: `createdResponse(res, user, 'User created')`.
- Example Output: `res.status(201).json({ success: true, data: user, message: 'User created' })`.
- Business Logic: Enforces 201 for creation endpoints.
- Edge Cases: None beyond `successResponse`.
- Notes: Thin wrapper around `successResponse`.

## Function: noContentResponse
- Location: `src/shared/utils/response.ts:22`
- Purpose: Send an HTTP 204 No Content response with an empty body.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `res` | `Response` | Yes | Express response. |
- Return Type: `void`.
- Throws: Nothing.
- Called By: Handlers where no content should be returned (e.g. successful delete).
- Calls: `res.status(204).send()`.
- Execution Flow: `res.status(204).send()`.
- Example Input: `noContentResponse(res)`.
- Example Output: HTTP 204 with empty body.
- Business Logic: 204 has no response body by definition, so it sends an empty body rather than JSON.
- Edge Cases: Clients receiving 204 must not try to parse a JSON body.
- Notes: Used typically after delete operations.

## Function: errorResponse
- Location: `src/shared/utils/response.ts:26`
- Purpose: Send a structured error response with `success: false`.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `res` | `Response` | Yes | Express response. |
  | `message` | `string` | Yes | Human-readable error message. |
  | `statusCode` | `number` | No (default `500`) | HTTP status code. |
  | `errors` | `Record<string, string \| string[]>` | No | Optional field-level error map (e.g. validation errors). |
- Return Type: `void`.
- Throws: Nothing.
- Called By: Handlers that respond directly with an error (e.g. when preferring a helper over throwing an `AppError`).
- Calls:
  - `res.status(statusCode).json(body)`.
- Execution Flow:
  1. Build `body: ApiResponse<null> = { success: false, message, ...(errors && { errors }) }`.
  2. `res.status(statusCode).json(body)`.
- Example Input: `errorResponse(res, 'Bad input', 400, { email: ['required'] })`.
- Example Output: `res.status(400).json({ success: false, message: 'Bad input', errors: { email: ['required'] } })`.
- Business Logic: Standardizes error envelopes; `errors` is included only when provided.
- Edge Cases:
  - `errors` is conditionally spread, so absent when not passed.
  - `data` is omitted (typed `null`) on error envelopes.
- Notes: Prefer throwing structured `AppError`s and letting `errorHandler` respond; use this for ad-hoc error responses when needed.

## Function: paginatedResponse
- Location: `src/shared/utils/response.ts:40`
- Purpose: Send a 200 success response containing a paginated list and pagination metadata.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `res` | `Response` | Yes | Express response. |
  | `data` | `T[]` | Yes | The array of items for the current page. |
  | `pagination` | `{ page: number; limit: number; total: number; totalPages: number }` | Yes | Pagination metadata. |
- Return Type: `void`.
- Throws: Nothing.
- Called By: List/query handlers returning paged results.
- Calls:
  - `res.status(200).json(body)`.
- Execution Flow:
  1. Build `body: PaginatedResponse<T> = { success: true, data, pagination }`.
  2. `res.status(200).json(body)`.
- Example Input: `paginatedResponse(res, users, { page: 1, limit: 10, total: 120, totalPages: 12 })`.
- Example Output: `res.status(200).json({ success: true, data: users, pagination: { page: 1, limit: 10, total: 120, totalPages: 12 } })`.
- Business Logic: Standardizes paginated list responses with metadata for clients to render controls.
- Edge Cases:
  - `pagination` is required; callers must supply all four metadata fields.
  - `data` is an array type (`T[]`).
- Notes: Always sends status 200.

# Internal Functions
All five exported helpers are the module-level functions (documented above).

# Execution Flow
1. A route handler computes a result.
2. It calls the appropriate response helper with `res` and data/message.
3. The helper builds the `ApiResponse`/`PaginatedResponse` envelope and writes it via `res.status(...).json(...)` / `res.send()`.

# Related Files
- `src/shared/utils/index.ts` (re-exports these)
- `src/shared/types/api-response.type.ts`
- `src/shared/types/pagination.type.ts`

# Example Usage
```ts
import { successResponse, createdResponse, noContentResponse, errorResponse, paginatedResponse } from '../../shared/utils';

successResponse(res, user, 'Fetched');
createdResponse(res, user, 'Created');
noContentResponse(res);
errorResponse(res, 'Forbidden', 403);
paginatedResponse(res, users, { page, limit, total, totalPages });
```

# Best Practices
- Use these helpers consistently so every endpoint shares the same envelope.
- Use `createdResponse`/`noContentResponse` for 201/204 semantics.
- Prefer throwing structured `AppError`s for error flows and reserve `errorResponse` for ad-hoc needs.
- Pass the full `pagination` metadata object to `paginatedResponse`.

# Common Mistakes
- Mixing response shapes (sometimes including `message`, sometimes not).
- Manually writing `res.json(...)` with inconsistent bodies instead of using these helpers.
- Sending a JSON body for 204 (should be empty via `noContentResponse`).
- Forgetting `pagination` metadata on list endpoints.

# Notes For Frontend Developers
These helpers define the canonical JSON envelopes:
- `successResponse`: `{ success: true, data?, message? }`.
- `createdResponse`: same as success but status `201`.
- `noContentResponse`: status `204`, no body (do not parse JSON).
- `errorResponse`: `{ success: false, message, errors? }`.
- `paginatedResponse`: `{ success: true, data: T[], pagination: { page, limit, total, totalPages } }`.
Build client response types and request/response interceptor helpers to match these shapes exactly.
