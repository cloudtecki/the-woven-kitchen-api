# File Name

`get-user-by-id.query.ts`

# File Path

`src/application/queries/get-user-by-id.query.ts`

# Purpose

Defines the `GetUserByIdQuery` class, an immutable CQRS read-model message that requests a single user record identified by its `id`. It is executed by `GetUserByIdHandler` against the read path (via `IUserRepository.findById`).

# Responsibilities

- Carry the required `id` of the user being requested.
- Preserve immutability via a `readonly` constructor property.
- Act as the typed message that keeps the API controller decoupled from the read implementation.
- Stay behavior-free: the query class only describes what data is wanted, never how it is fetched.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| *(none)* | — | This file has no imports and uses no external libraries. |

# Exports

- `GetUserByIdQuery` (class)

# Internal Functions

None. The class contains only a constructor and one public readonly field.

# Execution Flow

1. The API layer validates the route id (usually via `userIdParamsSchema`).
2. The controller constructs `new GetUserByIdQuery(req.params.id)`.
3. The query instance is dispatched to `GetUserByIdHandler.execute(query)`.
4. The handler calls `userRepository.findById(query.id)`.
5. If no user matches, the handler throws `NotFoundError`; otherwise the user entity is returned for serialization.

# Related Files

- `src/application/queries/get-all-users.query.ts` — companion list query
- `src/application/queries/index.ts` — barrel exporting this class
- `src/application/handlers/get-user-by-id.handler.ts` — the handler that executes this query
- `src/application/dto/user.dto.ts` — `userIdParamsSchema` validates the `id` before the query is built
- `src/domain/repositories/user-repository.interface.ts` — `findById(id): Promise<User | null>`

# Example Usage

```ts
// Controller handling GET /users/:id
const { id } = userIdParamsSchema.parse(req.params);
const query = new GetUserByIdQuery(id);

const user = await getUserByIdHandler.execute(query);
res.status(200).json(user);
```

# Best Practices

- Keep query objects tiny and immutable; a single-finding query has exactly one field.
- Separate the query message (what) from the handler (how) to preserve CQRS boundaries.
- Validate the id format at the edge (DTO layer) before it flows into the query.
- Reuse the same query object across caching layers if the read path is ever optimized.

# Common Mistakes

- Granting the query object behavior or DB access — that belongs to the handler/repository.
- Building the query with an unvalidated id and letting invalid ObjectIds surface as Mongo cast errors instead of a clean 404.
- Confusing `GetUserByIdQuery` (read) with `UpdateUserCommand`/`DeleteUserCommand` (write) when both need an `id`.

# Notes For Frontend Developers

- Fetching one user is typically `GET /users/:id`.
- Expect a 200 with the user object on success; expect a 404 `NOT_FOUND` if the id does not exist — handle that case gracefully (e.g. redirect to listing or show "not found" state).
- The returned user shape contains `id`, `email`, `name`, `role`, `isActive`, `createdAt`, `updatedAt` (per the domain `User` entity).
- `role` comes back as one of `"ADMIN"`, `"MANAGER"`, `"STAFF"`, so you can map it directly for badges/filters.

## Function: GetUserByIdQuery

- Location: `src/application/queries/get-user-by-id.query.ts:1`
- Purpose: Immutable query message requesting a single user by id.
- Parameters:

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Identifier of the user to fetch. Stored as `public readonly id`. |

- Return Type: A new `GetUserByIdQuery` instance.
- Throws: Nothing (trivial constructor).
- Called By:
  - API controller / route handler for `GET /users/:id`.
  - Tests that build the query directly.
- Calls: Nothing (pure value holder).
- Execution Flow:
  1. Constructor assigns `id` to `public readonly id`.
  2. Instance is dispatched to `GetUserByIdHandler.execute`.
- Example Input:
  ```ts
  new GetUserByIdQuery('663c...id')
  ```
- Example Output:
  ```
  GetUserByIdQuery { id: '663c...id' }
  ```
- Business Logic: None embedded — the object only carries the lookup key. Finding the record, null-checking, and 404 mapping happen inside `GetUserByIdHandler`.
- Edge Cases:
  - Empty id: legal at the type level but caught by `userIdParamsSchema`.
  - Unknown id: handler throws `NotFoundError('User')` → HTTP 404.
  - Malformed (non-ObjectId) string: depends on repository cast behavior; validate at the edge to avoid ugly 500-style Mongo errors.
- Notes: This is the read-model counterpart pattern to `DeleteUserCommand` (same shape) but belongs to the query side of CQRS.