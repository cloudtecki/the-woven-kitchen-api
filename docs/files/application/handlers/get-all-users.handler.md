# File Name

`get-all-users.handler.ts`

# File Path

`src/application/handlers/get-all-users.handler.ts`

# Purpose

Implements the read-side use case "list users (paginated)" in the CQRS application layer. `GetAllUsersHandler` is an Inversify `@injectable` handler that consumes a `GetAllUsersQuery`, fetches a page of users via `IUserRepository.findAll(page, limit)`, computes pagination metadata (`totalPages`), and returns a list envelope `{ data, total, page, limit, totalPages }`.

# Responsibilities

- Register with Inversify as injectable and constructor-inject `IUserRepository` via `TYPES.UserRepository`.
- Execute the paginated list query against the repository's read path.
- Compute the page-count metadata from the repository's total, providing the full pagination envelope to consumers.
- Return `FindAllResult` augmented with the echoed `page`, `limit`, and derived `totalPages`.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `injectable` (from `inversify`) | decorator | Marks the class as injectable by the DI container. |
| `inject` (from `inversify`) | decorator/function | Injects the `TYPES.UserRepository`-bound implementation. |
| `GetAllUsersQuery` (from `../queries/get-all-users.query`) | class | The query value object carrying `page` and `limit`. |
| `IUserRepository` (from `../../domain/repositories/user-repository.interface`) | interface | The repository port; `findAll(page?, limit?)` returns `Promise<FindAllResult>`. |
| `User` (from `../../domain/entities/user.entity`) | interface | The entity type of each element in `data`. |
| `TYPES` (from `../../shared/constants/tokens`) | const object | Inversify token `TYPES.UserRepository` used for injection. |
| `FindAllResult` (from `../../domain/repositories/user-repository.interface`) | interface | The shape `{ data: User[]; total: number }` returned by the repository and embedded in the handler's result. |

# Exports

- `GetAllUsersHandler` (class)

# Internal Functions

See the `Function: execute` section below.

# Execution Flow

1. The DI container resolves `GetAllUsersHandler` with the bound `IUserRepository`.
2. A controller calls `await handler.execute(query)`, where `query.page`/`query.limit` were already validated/coerced by `userQuerySchema`.
3. `execute` destructures `const { data, total } = await this.userRepository.findAll(query.page, query.limit)`.
4. `totalPages = Math.ceil(total / query.limit)` is computed.
5. The handler returns `{ data, total, page: query.page, limit: query.limit, totalPages }`.

# Related Files

- `src/application/queries/get-all-users.query.ts` — the input contract (`GetAllUsersQuery`)
- `src/application/handlers/get-user-by-id.handler.ts` — sibling read handler (single)
- `src/application/handlers/index.ts` — barrel exporting this handler
- `src/domain/repositories/user-repository.interface.ts` — the port (`findAll`, `FindAllResult`)
- `src/domain/entities/user.entity.ts` — element type of `data`
- `src/shared/constants/tokens.ts` — `TYPES.UserRepository` token
- `src/application/dto/user.dto.ts` — `userQuerySchema` validates/coerces `page`/`limit` before the query is built

# Example Usage

```ts
import { Container } from 'inversify';
import { GetAllUsersHandler, GetAllUsersQuery } from '../application';

const handler = container.get<GetAllUsersHandler>(TYPES.GetAllUsersHandler);

const result = await handler.execute(new GetAllUsersQuery(2, 25));
// { data: [ ...up to 25 users ], total: 61, page: 2, limit: 25, totalPages: 3 }
```

# Best Practices

- Own the pagination math centrally in the handler so controllers and clients don't re-derive `totalPages` inconsistently.
- Return the envelope with echoed `page`/`limit` so clients never guess which cursor was applied.
- Keep `limit` bounded upstream (`userQuerySchema` caps at 100) to protect DB queries from runaway sizes.
- Resist adding sorting/filtering directly here — extend the query object and DTO if the API needs it.

# Common Mistakes

- Forgetting to echo `page`/`limit` and computing `totalPages` in multiple client/server places with different rounding.
- Dividing by an unvalidated `limit` (0/NaN breaks `total/limit`), so always validate query params first.
- Using 0-based pages internally while the API is 1-based.
- Returning the bare `FindAllResult` and omitting pagination metadata, breaking the documented envelope contract.

# Notes For Frontend Developers

- Listing users → `GET /users?page=1&limit=20`.
- The response is an envelope:
  ```json
  { "data": [...], "total": 61, "page": 2, "limit": 25, "totalPages": 3 }
  ```
- Render totals, "prev/next" buttons, and page counts using `total`, `page`, `limit`, `totalPages` — they are authoritative server values.
- Iterate `data` (the array) for the actual users; the envelope is *not* the array.
- An empty dataset returns `{ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }` — show an empty state rather than an error.
- The server caps `limit` at 100 and min `page` at 1; query params are coerced from strings automatically.

## Function: execute

- Location: `src/application/handlers/get-all-users.handler.ts:12`
- Purpose: Fetches a page of users and returns them wrapped in pagination metadata.
- Parameters:

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `query` | `GetAllUsersQuery` | Yes | Immutable query carrying `page` (default 1) and `limit` (default 20). |

- Return Type: `Promise<FindAllResult & { page: number; limit: number; totalPages: number }>` — `{ data: User[]; total: number; page: number; limit: number; totalPages: number }`.
- Throws: Nothing directly. (Infrastructure errors from the repository propagate as-is; unlike the single-user handler this never throws a `NotFoundError`, since an empty list is a valid result.)
- Called By:
  - API controller / mediator for `GET /users`.
  - CQRS query dispatcher.
  - Tests (mocked repository).
- Calls:
  - `this.userRepository.findAll(query.page, query.limit)`
- Execution Flow:
  1. `const { data, total } = await this.userRepository.findAll(query.page, query.limit)`.
  2. `const totalPages = Math.ceil(total / query.limit)`.
  3. Return `{ data, total, page: query.page, limit: query.limit, totalPages }`.
- Example Input:
  ```ts
  new GetAllUsersQuery(2, 25)
  ```
- Example Output:
  ```ts
  {
    data: [ /* up to 25 User entities */ ],
    total: 61,
    page: 2,
    limit: 25,
    totalPages: 3,
  }
  ```
- Business Logic:
  - Delegates the actual query + total-count to the repository (an atomic or two-query approach depends on the implementation).
  - Derives `totalPages` with ceiling division so partial last pages get their own page number.
  - Echoes the request cursor back so the envelope is self-describing.
- Edge Cases:
  - `total = 0` → `totalPages = 0` (empty page set is valid, never an error).
  - `total` not a multiple of `limit` → ceiling makes the last page short; `totalPages` still counts it.
  - Huge `limit` values passed directly (bypassing the DTO) → ratio behaves, but repository performance is the caller's risk; always validate via `userQuerySchema`.
  - `query.page` beyond the last page → returns empty `data` with `total` intact (no clamping in the handler).
- Notes: This is the only user handler whose return type composes a repository result with handler-derived metadata, making it the natural source of truth for list responses.