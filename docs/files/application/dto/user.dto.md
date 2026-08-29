# File Name

`user.dto.ts`

# File Path

`src/application/dto/user.dto.ts`

# Purpose

Defines the validation contracts (Data Transfer Objects) of the application layer using the zod library. This file is the single source of truth for the input shapes accepted by the user-facing API: create, update, list, and id-based lookups. It also exports the TypeScript types inferred from those schemas so the rest of the application (controllers, commands, handlers) stays type-aligned with runtime validation.

# Responsibilities

- Declare `createUserSchema` for create-user request bodies.
- Declare `updateUserSchema` for partial update (patch) request bodies.
- Declare `userQuerySchema` for pagination query-string parameters (`page`, `limit`), including string-to-number coercion.
- Declare `userIdParamsSchema` for route path parameters containing an `id`.
- Export the four inferred TypeScript types (`CreateUserInput`, `UpdateUserInput`, `UserQueryInput`, `UserIdParamsInput`) used across the application layer.
- Enforce domain constraints at the edge: valid email, name length limits, enum role values, numeric bounds on pagination.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `z` (from `zod`) | external library | The zod validation/schema library used to build all schemas in this file. |
| `UserRole` (from `../../domain/value-objects/user-role`) | value | Domain enum (`ADMIN`, `MANAGER`, `STAFF`) used with `z.nativeEnum` so the `role` field accepts only those strings. |

# Exports

Values:
- `createUserSchema` — zod object schema for creating a user
- `updateUserSchema` — zod object schema for updating a user
- `userQuerySchema` — zod object schema for pagination params
- `userIdParamsSchema` — zod object schema for id route params

Types:
- `CreateUserInput` — `z.infer<typeof createUserSchema>`
- `UpdateUserInput` — `z.infer<typeof updateUserSchema>`
- `UserQueryInput` — `z.infer<typeof userQuerySchema>`
- `UserIdParamsInput` — `z.infer<typeof userIdParamsSchema>`

# Internal Functions

There are no locally declared function symbols. The exported constants are produced by calling zod builder functions (`z.object`, `z.string`, `z.nativeEnum`, `z.coerce.number.int`, `z.boolean`, `z.default`, `z.optional`, `z.email`, `z.min`, `z.max`). Each exported schema constant is documented below as a schema definition section.

---

## Schema: createUserSchema

- Location: `src/application/dto/user.dto.ts:4`
- Purpose: Validate the request body used to create a user.
- Parameters: *(schema builder, not a runtime function)* — the object literal passed to `z.object`.

| Field | Type | Required | Rule |
| ----- | ---- | -------- | ---- |
| `email` | `string` | Yes | Must be a valid email format; fails with `'Invalid email format'` otherwise. |
| `name` | `string` | Yes | `min(1)` → `'Name is required'`; `max(100)` → `'Name must be under 100 characters'`. |
| `role` | `UserRole` (enum) | No | `z.nativeEnum(UserRole)`, so only `'ADMIN'`, `'MANAGER'`, `'STAFF'` are accepted. |

- Return Type: `ZodObject` for `{ email: string; name: string; role?: UserRole }`.
- Throws: `ZodError` on `parse` when data is invalid (does not throw during definition).
- Called By:
  - API controller for `POST /users` to validate `req.body` before building `CreateUserCommand`.
  - Tests that validate fixtures.
- Calls: `z.object`, `z.string().email()`, `z.string().min().max()`, `z.nativeEnum()`.
- Execution Flow: `.parse(input)` trims, checks email format, enforces name bounds, validates role against the enum, and returns the sanitized/typed object.
- Example Input:
  ```json
  { "email": "alice@corp.com", "name": "Alice", "role": "STAFF" }
  ```
- Example Output (parsed):
  ```ts
  { email: 'alice@corp.com', name: 'Alice', role: 'STAFF' }
  ```
- Business Logic: Edge validation for the create-user use case; defaults for missing `role` are handled later by `CreateUserHandler` (falls back to `UserRole.STAFF`).
- Edge Cases:
  - Missing `role` → allowed (optional).
  - Email without `@`/domain → `'Invalid email format'`.
  - Empty or >100-char name → specific messages above.
  - Any other role string → enum error.
- Notes: This is the same field set carried by `CreateUserCommand` and `CreateUserData` (repository).

---

## Schema: updateUserSchema

- Location: `src/application/dto/user.dto.ts:10`
- Purpose: Validate the request body used to partially update a user.
- Parameters: *(schema builder)* — object literal passed to `z.object`.

| Field | Type | Required | Rule |
| ----- | ---- | -------- | ---- |
| `name` | `string` | No | `min(1)`, `max(100)`. |
| `role` | `UserRole` (enum) | No | `z.nativeEnum(UserRole)`. |
| `isActive` | `boolean` | No | Must be a boolean. |

- Return Type: `ZodObject` for `{ name?: string; role?: UserRole; isActive?: boolean }`.
- Throws: `ZodError` on invalid `parse`; not during definition.
- Called By:
  - API controller for the user update route to validate `req.body` before building `UpdateUserCommand`.
  - Tests.
- Calls: `z.object`, `z.string().min().max()`, `z.nativeEnum()`, `z.boolean()`, `.optional()`.
- Execution Flow: `.parse(input)` validates each provided field; absent fields are left out of the result.
- Example Input:
  ```json
  { "role": "MANAGER", "isActive": false }
  ```
- Example Output (parsed):
  ```ts
  { role: 'MANAGER', isActive: false }
  ```
- Business Logic: Enforces the patch contract for `UpdateUserHandler` — only `name`, `role`, `isActive` are updatable via this API (email is not).
- Edge Cases:
  - Empty object `{}` → valid (no-op patch).
  - `null` instead of omitted → fails (fields are optional, not nullable) — instructs clients to omit keys rather than send `null`.
  - `isActive: "false"` (string) → fails; must be a real boolean.
- Notes: Mirrors `UpdateUserData` on `IUserRepository` minus `email`, which the command layer intentionally does not support.

---

## Schema: userQuerySchema

- Location: `src/application/dto/user.dto.ts:16`
- Purpose: Validate and coerce pagination query parameters for the list endpoint.
- Parameters: *(schema builder)* — object literal passed to `z.object`.

| Field | Type | Required | Rule |
| ----- | ---- | -------- | ---- |
| `page` | `number` | No (default `1`) | `z.coerce.number().int().min(1)`, default `1`. |
| `limit` | `number` | No (default `20`) | `z.coerce.number().int().min(1).max(100)`, default `20`. |

- Return Type: `ZodObject` for `{ page: number; limit: number }`.
- Throws: `ZodError` on invalid input (e.g. `limit > 100`, non-integer).
- Called By:
  - API controller for `GET /users` to parse `req.query` into validated numbers.
  - Tests.
- Calls: `z.object`, `z.coerce.number()`, `.int()`, `.min()`, `.max()`, `.default()`.
- Execution Flow: The raw query-string values (strings) are coerced to numbers, checked to be integers, ranged (page ≥ 1, 1 ≤ limit ≤ 100), and defaulted. The result feeds `GetAllUsersQuery`.
- Example Input:
  ```ts
  { page: '2', limit: '50' }   // raw query object from Express
  ```
- Example Output (parsed):
  ```ts
  { page: 2, limit: 50 }
  ```
- Business Logic: Sanitizes user-supplied pagination to protect the repository from absurd page sizes or negative offsets.
- Edge Cases:
  - Missing both → `{ page: 1, limit: 20 }` via defaults.
  - `page: '0'` → fails `.min(1)`.
  - `limit: '101'` → fails `.max(100)`.
  - `page: 'abc'` → coercion produces `NaN`, which fails the number/int checks.
- Notes: `z.coerce` is what lets the API accept URL query strings transparently; it is also what makes `limit` bounded server-side regardless of client input.

---

## Schema: userIdParamsSchema

- Location: `src/application/dto/user.dto.ts:21`
- Purpose: Validate `id` route/path parameters for user-scoped endpoints.
- Parameters: *(schema builder)* — object literal passed to `z.object`.

| Field | Type | Required | Rule |
| ----- | ---- | -------- | ---- |
| `id` | `string` | Yes | `min(1)` → error `'id is required'` when empty. |

- Return Type: `ZodObject` for `{ id: string }`.
- Throws: `ZodError` when `id` is missing/empty.
- Called By:
  - Controllers for `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`.
  - Tests.
- Calls: `z.object`, `z.string().min()`.
- Execution Flow: `.parse(params)` extracts a non-empty `id` used to construct `GetUserByIdQuery`, `UpdateUserCommand`, or `DeleteUserCommand`.
- Example Input:
  ```ts
  { id: '663c...id' }
  ```
- Example Output (parsed):
  ```ts
  { id: '663c...id' }
  ```
- Business Logic: Guards the three id-driven routes against missing identifiers. (It does not validate ObjectId hex format — that remains a repository concern.)
- Edge Cases:
  - Empty string → `'id is required'`.
  - Extra params → ignored (object schema strips unknown keys by default).
  - Non-objectid valid strings → pass; casting behavior handled downstream.
- Notes: Shared by read and write routes, keeping the "id must be present" rule in one place.

---

## Type: CreateUserInput

- Location: `src/application/dto/user.dto.ts:25`
- Purpose: `z.infer<typeof createUserSchema>` — the TypeScript type of a valid create-user payload.
- Type: `{ email: string; name: string; role?: UserRole }`
- Notes: Pairs compile-time typing with the runtime schema above.

## Type: UpdateUserInput

- Location: `src/application/dto/user.dto.ts:26`
- Purpose: `z.infer<typeof updateUserSchema>` — the TypeScript type of a valid update patch.
- Type: `{ name?: string; role?: UserRole; isActive?: boolean }`
- Notes: All fields optional, matching the patch semantics.

## Type: UserQueryInput

- Location: `src/application/dto/user.dto.ts:27`
- Purpose: `z.infer<typeof userQuerySchema>` — pagination params type.
- Type: `{ page: number; limit: number }`
- Notes: After coercion/defaults, the type is always numeric.

## Type: UserIdParamsInput

- Location: `src/application/dto/user.dto.ts:28`
- Purpose: `z.infer<typeof userIdParamsSchema>` — id route-params type.
- Type: `{ id: string }`
- Notes: Used to type `req.params` after parsing.

# Related Files

- `src/application/dto/index.ts` — barrel re-exporting all of the above
- `src/application/commands/create-user.command.ts`, `update-user.command.ts`, `delete-user.command.ts` — commands built from validated inputs
- `src/application/queries/get-user-by-id.query.ts`, `get-all-users.query.ts` — queries built from validated inputs
- `src/application/handlers/*.ts` — handlers consuming commands/queries
- `src/domain/value-objects/user-role.ts` — enum used by `role` fields
- `src/domain/repositories/user-repository.interface.ts` — `CreateUserData`/`UpdateUserData` mirror these shapes

# Example Usage

```ts
import { createUserSchema, userQuerySchema, userIdParamsSchema } from './dto';
import { CreateUserCommand } from './commands';

const input = createUserSchema.parse(req.body);            // throws ZodError on bad body
const command = new CreateUserCommand(input.email, input.name, input.role);

const { page, limit } = userQuerySchema.parse(req.query);
const { id } = userIdParamsSchema.parse(req.params);
```

# Best Practices

- Keep every schema near its consuming command/query so the application layer documents its own contract.
- Use `z.infer<typeof schema>` for derived types instead of hand-written interfaces; they cannot drift out of sync.
- Prefer `.optional()` over `.nullable()` for absent fields so "absent" never conflates with `null`.
- Use `z.coerce.number()` for query params so clients can send strings from the URL bar freely.
- Centralize role validation with `z.nativeEnum(UserRole)` instead of `z.enum([...])` so the domain list stays authoritative.

# Common Mistakes

- Re-declaring ambiguous error messages inconsistently (e.g. name min without a message but twice-stated). Keep messages user-displayable everywhere.
- Using `z.enum(['ADMIN','MANAGER','STAFF'])` and letting it drift from the domain `UserRole`.
- Validating `req.params` with `userQuerySchema` (or vice versa) and passing the schema object instead of calling `.parse`.
- Forgetting that unknown-top-level keys in object schemas are stripped by default, so request bodies with extra fields silently lose them.

# Notes For Frontend Developers

- These four schemas *are* the API contract for user endpoints:
  - `POST /users` body → `createUserSchema`: `{ email (valid email), name (1–100 chars), role?: "ADMIN" | "MANAGER" | "STAFF" }`
  - Update body → `updateUserSchema`: partial `{ name?, role?, isActive? }`
  - `GET /users` query → `userQuerySchema`: `page?` (min 1, default 1), `limit?` (1–100, default 20); string values are coerced server-side
  - `:id` params → `userIdParamsSchema`: a required non-empty id
- Send validation errors to your UI: `ZodError` responses list per-field issues (e.g. the email/name messages above).
- Never send `null` to "clear" an update field; omit the key instead.
- For pagination cache the server-side `totalPages` rather than recomputing it (unless you like `Math.ceil`).
- `role` values returned to you are always uppercase strings; normalize case when displaying.