# File Name

`get-all-users.query.ts`

# File Path

`src/application/queries/get-all-users.query.ts`

# Purpose

Defines the `GetAllUsersQuery` class, an immutable CQRS read-model message asking for a paginated list of users. It carries optional `page` and `limit` parameters (with defaults 1 and 20) and is executed by `GetAllUsersHandler` which composes pagination metadata around `IUserRepository.findAll`.

# Responsibilities

- Carry cursor parameters for pagination: `page` (1-based) and `limit` (page size).
- Provide sensible defaults (`page = 1`, `limit = 20`) when arguments are omitted.
- Preserve immutability via `readonly` constructor properties.
- Stay behavior-free; all pagination math is done by the handler, not the query object.
- Model the "read many users" intent distinctly from the single-user query.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| *(none)* | — | This file has no imports and uses no external libraries. |

# Exports

- `GetAllUsersQuery` (class)

# Internal Functions

None. The class contains only a constructor and two public readonly fields.

# Execution Flow

1. The API layer parses and coerces query-string params, usually via `userQuerySchema` (which coerces strings to numbers and asserts `page >= 1`, `1 <= limit <= 100`).
2. The controller constructs `new GetAllUsersQuery(page?, limit?)` — if omitted, defaults apply.
3. The query instance is dispatched to `GetAllUsersHandler.execute(query)`.
4. The handler calls `userRepository.findAll(query.page, query.limit)` and computes `totalPages = Math.ceil(total / limit)`.
5. The handler returns `{ data, total, page, limit, totalPages }` for serialization.

# Related Files

- `src/application/queries/get-user-by-id.query.ts` — companion single-user query
- `src/application/queries/index.ts` — barrel exporting this class
- `src/application/handlers/get-all-users.handler.ts` — the handler that executes this query
- `src/application/dto/user.dto.ts` — `userQuerySchema` validates/coerces `page` and `limit` from the raw query string
- `src/domain/repositories/user-repository.interface.ts` — `findAll(page?, limit?): Promise<FindAllResult>` with `{ data, total }`

# Example Usage

```ts
// Controller handling GET /users
const { page, limit } = userQuerySchema.parse(req.query);

const query = new GetAllUsersQuery(page, limit);
const result = await getAllUsersHandler.execute(query);

res.status(200).json(result);
// { data: [...], total: 42, page: 1, limit: 20, totalPages: 3 }
```

# Best Practices

- Default the pagination values at the query level so an empty `GetAllUsersQuery()` still yields a valid, well-defined request.
- Enforce upper bounds on `limit` at validation time (the DTO caps at 100) to protect the repository from unbounded reads.
- Keep `page` 1-based for API friendliness; document that clearly to consumers.
- Let the handler own the `totalPages` computation so query objects never contain math.
- Use readonly fields so the pagination request cannot change after dispatch.

# Common Mistakes

- Allowing `limit` to be 0 or negative, which would break `totalPages` math and MongoDB `limit()` calls; the DTO guards this but hand-built queries can bypass it.
- Using 0-based `page` internally while the REST API uses 1-based, causing off-by-one responses.
- Forgetting that `findAll` may receive `undefined` when the query is empty — the repository must have its own graceful defaults.
- Doing `totalPages` math in the controller instead of the handler, duplicating logic.

# Notes For Frontend Developers

- Listing users is `GET /users?page=1&limit=20` (or just `GET /users`).
- `page` and `limit` are **numbers** in the response but arrive as strings in the URL — the server coerces them via `userQuerySchema`; you don't need to worry about sending strings, the API handles coercion.
- Response shape is **not a bare array**; it is `{ data: User[], total: number, page: number, limit: number, totalPages: number }`. Build your pagination UI (page buttons, "page X of Y", counts) from `page`, `limit`, `total`, `totalPages`.
- Since the schema caps `limit` at 100 and floors `page` at 1, requesting `page=0` will be coerced/validated by the server; send `page=1` for the first page.
- Empty lists are still valid responses: `{ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }`.

## Function: GetAllUsersQuery

- Location: `src/application/queries/get-all-users.query.ts:1`
- Purpose: Immutable paginated list query requesting a page of users.
- Parameters:

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `page` | `number` | No (default `1`) | The 1-based page number to fetch. Stored as `public readonly page = 1`. |
| `limit` | `number` | No (default `20`) | Maximum number of users to return per page. Stored as `public readonly limit = 20`. |

- Return Type: A new `GetAllUsersQuery` instance.
- Throws: Nothing (trivial constructor; no validation).
- Called By:
  - API controller for list endpoints (`GET /users`).
  - Tests building paginated query objects.
- Calls: Nothing (pure value holder).
- Execution Flow:
  1. Constructor assigns each argument (falling back to defaults `1` / `20` when `undefined`).
  2. Instance is dispatched to `GetAllUsersHandler.execute`, which forwards `page`/`limit` to the repository.
- Example Input:
  ```ts
  new GetAllUsersQuery(2, 50)
  // page = 2, limit = 50
  ```
- Example Output:
  ```
  GetAllUsersQuery { page: 2, limit: 50 }
  ```
  With no arguments, the default instance is `GetAllUsersQuery { page: 1, limit: 20 }`.
- Business Logic: None embedded — defaults and object shape only. Repositorial queries, counting, and `totalPages` computation live in `GetAllUsersHandler`.
- Edge Cases:
  - No arguments: defaults (`1`, `20`) apply thanks to parameter defaults.
  - `page = 0` / negative / `limit > 100` passed directly: type-wise allowed but violating conventions; the DTO layer (`userQuerySchema`) is intended to prevent this. The handler itself does not clamp values.
  - `limit` larger than total: fine — `data` just contains fewer/matching rows and `totalPages` computes to `1`.
  - `total = 0`: `totalPages = 0` (`Math.ceil(0 / limit)`).
- Notes: `Math.ceil(total / limit)` in the handler determines total pages; if `limit` were ever `0`/`NaN` the division would produce `NaN` — another reason the DTO's `min(1)` guard matters.