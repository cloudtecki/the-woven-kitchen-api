# File Name
`auth.middleware.ts`

# File Path
`src/shared/middleware/auth.middleware.ts`

# Purpose
Provides authentication and authorization Express middleware. `authenticate` verifies a `Bearer` JWT and attaches the decoded identity (`JwtPayload`) to the request; `authorize` enforces role-based access by checking the authenticated user's role against an allowed set. It also declares the `JwtPayload` interface and augments the Express `Request` type with an optional `user` property.

# Responsibilities
- Parse and validate the `Authorization: Bearer <token>` header.
- Decode/verify the JWT using the configured secret.
- Attach the verified payload to `req.user`.
- Enforce role-based authorization via a reusable `authorize(...roles)` factory.
- Provide the `JwtPayload` TypeScript shape and the global `Express.Request.user` augmentation.
- Re-throw authentication failures as `UnauthorizedError` (401) and permission failures as `ForbiddenError` (403).

# Dependencies
- `express` — `Request`, `Response`, `NextFunction` types for middleware signatures.
- `jsonwebtoken` (`jwt`) — `jwt.verify` to validate and decode the JWT.
- `../errors` — `UnauthorizedError`, `ForbiddenError` for structured auth/permission errors.
- `../../config` — `config.jwtSecret` used to verify the token.
- `../../domain/value-objects/user-role` — `UserRole` enum used in the decoded payload and role checks.

# Exports
- `JwtPayload` — interface `{ userId: string; email: string; role: UserRole }`.
- `authenticate` — middleware function.
- `authorize` — middleware factory `(...roles: UserRole[]) => middleware`.
- Global `Express.Request` augmentation adding `user?: JwtPayload`.

## Function: authenticate
- Location: `src/shared/middleware/auth.middleware.ts:21`
- Purpose: Verify the `Bearer` JWT, and if valid attach the decoded payload to `req.user` and continue; otherwise throw `UnauthorizedError`.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `req` | `Request` | Yes | Express request; reads `req.headers.authorization`. |
  | `_res` | `Response` | Yes | Express response (unused). |
  | `next` | `NextFunction` | Yes | Called with no args on success, enabling the next middleware/handler. |
- Return Type: `void`.
- Throws:
  - `UnauthorizedError('No token provided')` — when the header is missing or does not start with `'Bearer '`.
  - `UnauthorizedError('Invalid or expired token')` — when `jwt.verify` fails or produces an invalid payload.
- Called By: Express route registration (e.g. `router.get('/me', authenticate, handler)`).
- Calls:
  - `req.headers.authorization` read.
  - `jwt.verify(token, config.jwtSecret)`.
  - Assigns `req.user = decoded`.
  - `next()`.
- Execution Flow:
  1. Read the `authorization` header.
  2. If the header is missing or not prefixed with `'Bearer '`, throw `UnauthorizedError('No token provided')`.
  3. Extract the token (split on space, take index 1).
  4. `jwt.verify(token, config.jwtSecret)` → cast result to `JwtPayload`.
  5. Assign `req.user = decoded`.
  6. Call `next()`.
- Example Input: Request with header `Authorization: Bearer eyJhbGci...` and valid secret.
- Example Output: `req.user = { userId: '...', email: 'a@b.c', role: 'ADMIN' }`; `next()` is invoked.
- Business Logic: Centralized JWT verification upstream of all protected routes; invalid tokens never reach the handler.
- Edge Cases:
  - Header present but malformed (no space, empty token) → `jwt.verify` throws → `UnauthorizedError('Invalid or expired token')`.
  - If the thrown error is already `UnauthorizedError`, it is re-thrown as-is; any other error (e.g. `jwt.verify` failure) becomes `'Invalid or expired token'`.
  - Expired/incorrectly-signed tokens fail `verify` and map to `UnauthorizedError`.
- Notes: `req.user` is only set on success; downstream handlers should treat its absence as "not authenticated".

## Function: authorize
- Location: `src/shared/middleware/auth.middleware.ts:41`
- Purpose: Return a middleware that enforces role-based access: the request must be authenticated and its `req.user.role` must be in the allowed roles list.
- Parameters:
  | Name | Type | Required | Description |
  |------|------|----------|-------------|
  | `...roles` | `UserRole[]` | No (default none) | Allowed roles. If empty, only authentication is required (any authenticated role passes). |
- Return Type: `(req: Request, _res: Response, next: NextFunction) => void`.
- Throws: (the returned middleware throws) —
  - `UnauthorizedError('Not authenticated')` — when `req.user` is missing.
  - `ForbiddenError('Insufficient permissions')` — when roles are specified and `req.user.role` is not included.
- Called By: Route registration: `router.delete('/:id', authenticate, authorize(UserRole.ADMIN), handler)`.
- Calls:
  - Checks `req.user`.
  - `roles.includes(req.user.role)`.
  - `next()`.
- Execution Flow (returned middleware):
  1. If `!req.user` → throw `UnauthorizedError('Not authenticated')`.
  2. If `roles.length > 0 && !roles.includes(req.user.role)` → throw `ForbiddenError('Insufficient permissions')`.
  3. Otherwise call `next()`.
- Example Input: `authorize(UserRole.ADMIN, UserRole.MANAGER)`.
- Example Output (authorized): `next()` is invoked.
- Example Output (denied): throws `ForbiddenError('Insufficient permissions')`.
- Business Logic: Combines authentication check (must be logged in) with optional role gating; empty roles means "any authenticated user".
- Edge Cases:
  - Calling `authorize()` with no roles only enforces authentication, not a specific role.
  - Role values come from the `UserRole` enum (`ADMIN`, `MANAGER`, `STAFF`).
- Notes: `authorize` must be used *after* `authenticate` so that `req.user` is populated.

# Internal Functions
- `authenticate` and `authorize` are the two module-level functions (documented above).

# Execution Flow
1. A protected route applies `authenticate`, which verifies the JWT and populates `req.user`.
2. Optionally, `authorize(...roles)` restricts access by role.
3. On any auth/permission failure an `AppError` subclass is thrown, which the `errorHandler` middleware converts into the proper HTTP response (401 or 403).
4. On success, the next handler runs with a trusted `req.user`.

# Related Files
- `src/shared/middleware/index.ts`
- `src/shared/middleware/error-handler.middleware.ts`
- `src/shared/errors/unauthorized.error.ts`
- `src/shared/errors/forbidden.error.ts`
- `src/config/index.ts`
- `src/domain/value-objects/user-role.ts`

# Example Usage
```ts
import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware';
import { UserRole } from '../../domain/value-objects/user-role';

const router = Router();
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), handleDelete);
```

# Best Practices
- Always place `authenticate` before `authorize` in the middleware chain.
- Pass explicit allowed roles to `authorize` rather than relying on the empty-roles "any authenticated" behavior for sensitive endpoints.
- Use the `UserRole` enum as the single source of role values.

# Common Mistakes
- Putting `authorize` before `authenticate`, so `req.user` is always undefined.
- Expecting `authorize()` (no roles) to restrict roles; it only requires authentication.
- Catching the thrown auth errors and responding ad-hoc instead of letting `errorHandler` normalize them.

# Notes For Frontend Developers
- The JWT must be sent in the `Authorization` header as `Bearer <token>`; otherwise you get 401 `No token provided`.
- 401 (`UNAUTHORIZED`) means the token is missing/expired/invalid → re-login. 403 (`FORBIDDEN`) means the token is valid but the user's role is insufficient → hide/disable the action.
- The decoded token contains `userId`, `email`, and `role`; the frontend can mirror this shape to know the current user's role before deciding which UI to show.
