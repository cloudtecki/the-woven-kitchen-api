# File Name
`response.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\shared\utils\response.js`

# Purpose
Provides small helper functions that standardize how Express handlers write JSON responses (success, created, no-content, error, and paginated). They enforce consistent response envelopes. Plain JavaScript (CommonJS — `module.exports`).

# Responsibilities
- Write standardized success/created/no-content/error/paginated JSON responses.
- Use appropriate HTTP status codes (200/201/204/5xx).
- Reduce boilerplate and prevent inconsistent response shapes.

# Exports
- `successResponse` — success envelope (default 200).
- `createdResponse` — 201 created.
- `noContentResponse` — 204 empty.
- `errorResponse` — error envelope (default 500).
- `paginatedResponse` — paginated success (200).

## Function: successResponse
- Location: `src/shared/utils/response.js:3`
- Purpose: Send a generic success response with optional message, defaulting to 200.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `res` | object | Yes | Express response. |
  | `data` | any | Yes | Payload in `body.data`. |
  | `message` | string | No | Optional success message. |
  | `statusCode` | number | No (default 200) | HTTP status. |
- Return: `void`.
- Throws: Nothing.
- Called By: Route/handler code producing successful results.
- Calls: `res.status(statusCode).json(body)`.
- Execution Flow: Build `{ success:true, data, ...(message && { message }) }` and `res.status(statusCode).json(body)`.
- Example Input: `successResponse(res, { id: '1' }, 'Created ok')`.
- Example Output: `res.status(200).json({ success:true, data:{ id:'1' }, message:'Created ok' })`.
- Business Logic: Standardizes success envelope, omitting `message` when undefined.
- Edge Cases: `message` absent when not provided; `statusCode` overridable.

## Function: createdResponse
- Location: `src/shared/utils/response.js:9`
- Purpose: Send a 201 Created response via `successResponse`.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `res` | object | Yes | Express response. |
  | `data` | any | Yes | Created resource payload. |
  | `message` | string | No | Optional success message. |
- Return: `void`.
- Throws: Nothing.
- Called By: Handlers that create a resource.
- Calls: `successResponse(res, data, message, 201)`.
- Execution Flow: Delegates with status 201.
- Example Input: `createdResponse(res, user, 'User created')`.
- Example Output: `res.status(201).json({ success:true, data:user, message:'User created' })`.
- Business Logic: Enforces 201 for creation endpoints.

## Function: noContentResponse
- Location: `src/shared/utils/response.js:11`
- Purpose: Send an HTTP 204 No Content response with an empty body.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `res` | object | Yes | Express response. |
- Return: `void`.
- Throws: Nothing.
- Called By: Handlers where no content is returned (e.g. successful delete).
- Calls: `res.status(204).send()`.
- Execution Flow: `res.status(204).send()`.
- Example Output: HTTP 204 with empty body.
- Business Logic: 204 has no body by definition.
- Edge Cases: Clients must not parse a JSON body for 204.

## Function: errorResponse
- Location: `src/shared/utils/response.js:13`
- Purpose: Send a structured error response with `success: false`.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `res` | object | Yes | Express response. |
  | `message` | string | Yes | Error message. |
  | `statusCode` | number | No (default 500) | HTTP status. |
  | `details` | any | No | Optional field-level error details. |
- Return: `void`.
- Throws: Nothing.
- Called By: Handlers responding directly with an error.
- Calls: `res.status(statusCode).json(body)`.
- Execution Flow: Build `{ success:false, message, ...(details && { errors: details }) }` and send.
- Example Input: `errorResponse(res, 'Bad input', 400, { email:['required'] })`.
- Example Output: `res.status(400).json({ success:false, message:'Bad input', errors:{ email:['required'] } })`.
- Business Logic: Standardizes error envelope; `errors` present only when provided.
- Edge Cases: `details` absent when not passed.
- Notes: Prefer throwing structured `AppError`s; this is for ad-hoc errors.

## Function: paginatedResponse
- Location: `src/shared/utils/response.js:19`
- Purpose: Send a 200 success response with a list and pagination metadata.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `res` | object | Yes | Express response. |
  | `data` | array | Yes | Items for the current page. |
  | `pagination` | object | Yes | `{ page, limit, total, totalPages }`. |
- Return: `void`.
- Throws: Nothing.
- Called By: List/query handlers returning paged results.
- Calls: `res.status(200).json(body)`.
- Execution Flow: `res.status(200).json({ success:true, data, pagination })`.
- Example Input: `paginatedResponse(res, users, { page:1, limit:10, total:120, totalPages:12 })`.
- Example Output: 200 JSON with `data` and `pagination`.
- Business Logic: Standardizes paged list responses with metadata.

# Internal Functions
- All five helpers are the module-level exported functions (documented above).

# Execution Flow
- A handler computes a result and calls the appropriate helper with `res`; the helper builds the envelope and writes it.

# Related Files
- `src/shared/utils/index.js` — re-exports these.
- `src/shared/utils/async-handler.js` — sibling utility.

# Example Usage
```javascript
const { successResponse, createdResponse, noContentResponse, errorResponse, paginatedResponse } = require('../shared/utils/response');
successResponse(res, user, 'Fetched');
createdResponse(res, user, 'Created');
noContentResponse(res);
errorResponse(res, 'Forbidden', 403);
paginatedResponse(res, users, { page, limit, total, totalPages });
```

# Best Practices
- Use these helpers consistently so every endpoint shares the same envelope.
- Use `createdResponse`/`noContentResponse` for 201/204 semantics.
- Prefer throwing `AppError` for error flows and reserve `errorResponse` for ad-hoc use.

# Common Mistakes
- Mixing response shapes across endpoints.
- Writing inconsistent `res.json(...)` bodies manually.
- Sending a JSON body for 204.

# Notes For Frontend Developers
- These define the JSON envelopes:
  - success: `{ success:true, data?, message? }`.
  - created: same as success, status 201.
  - no-content: status 204, no body.
  - error: `{ success:false, message, errors? }`.
  - paginated: `{ success:true, data: T[], pagination: { page, limit, total, totalPages } }`.
