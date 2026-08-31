# API: GET /api/health

## Summary

Simple liveness endpoint. Returns `200 OK` with `{"status":"OK"}`. No database check, no authentication, no business logic. Intended for uptime probes and load-balancer health checks.

## Method

`GET`

## URL

`/api/health`

The route is defined in `src/api/routes/health.routes.js` on a relative path `/health`. It is mounted in `src/api/routes/index.js` and then in `src/app.js` under `config.apiPrefix` (which defaults to `/api`), yielding the full path `/api/health`.

## Middleware

**Route-level:** None beyond the `asyncHandler` wrapper (from `src/shared/utils/async-handler`), which catches async errors and forwards them to the Express error handler.

**Global app-level:** `helmet`, `cors`, `compression`, `express.json`, `requestLogger` — applied to all routes via `src/app.js`.

No validation middleware, no auth middleware, no rate limiting.

## Validation

None. The route accepts no request body and ignores any query parameters.

## Controller

N/A — the response is written inline within the route handler in `src/api/routes/health.routes.js`. No separate controller class is involved.

## Command/Query

N/A — no command or query DTO is constructed. This is not a business operation.

## Handler

N/A — no application-layer handler is involved. The route handler is a plain inline async function.

## Repository

N/A — no repository is called. No database I/O is performed.

## Database Operation

None. This endpoint does not touch MongoDB. It returns a fixed response regardless of database state.

## Request Example

```http
GET /api/health HTTP/1.1
Host: localhost:3000
```

No query parameters, no request body.

## Response Example

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "OK"
}
```

## Error Responses

This endpoint does not produce error responses under normal operation. If the async handler catches an unexpected thrown error, it will be forwarded to the global Express error handler, which returns:

```json
{
  "status": "error",
  "message": "<error message>",
  "code": "INTERNAL_ERROR"
}
```

with an appropriate HTTP status code.

Unmatched routes elsewhere return `404` via the global `notFoundHandler`:

```json
{
  "status": "error",
  "message": "Route not found",
  "code": "NOT_FOUND"
}
```

## Flow Diagram

```mermaid
flowchart TD
    A[Client: GET /api/health] --> B[Express global middleware\nhelmet, cors, compression, json, logger]
    B --> C[health.routes.js\nasyncHandler]
    C --> D["res.status(200).json({ status: 'OK' })"]
    D --> E[Client: 200 OK\n{ status: OK }]
```
