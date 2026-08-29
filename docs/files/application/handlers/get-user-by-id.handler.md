# File Name

`get-user-by-id.handler.ts`

# File Path

`src/application/handlers/get-user-by-id.handler.ts`

# Purpose

Implements the read-side use case "get one user by id" in the CQRS application layer. `GetUserByIdHandler` is an Inversify `@injectable` handler that consumes a `GetUserByIdQuery`, retrieves the user via `IUserRepository.findById`, and maps a `null` result to `NotFoundError` (HTTP 404). It returns the domain `User` entity.

# Responsibilities

- Register with Inversify as injectable and constructor-inject `IUserRepository` via `TYPES.UserRepository`.
- Execute the get-by-id query against the repository's read path.
- Convert the repository's nullable result into a definitive outcome: found → `User`, not found → `NotFoundError`.
- Applies no authorization/business filtering here — single-record read by primary key.

# Dependencies

| Import | Kind | Description |
| ------ | ---- | ----------- |
| `injectable` (from `inversify`) | decorator | Marks the class as injectable by the DI container. |
| `inject` (from `inversify`) | decorator/function | Injects the `TYPES.UserRepository`-bound implementation. |
| `GetUserByIdQuery` (from `../queries/get-user-by-id.query`) | class | The query value object carrying the `id` to fetch. |
| `IUserRepository` (from `../../domain/repositories/user-repository.interface`) | interface | The repository port; `findById(id)` returns `Promise<User \| null>`. |
| `User` (from `../../domain/entities/user.entity`) | interface | The domain entity type returned by `execute`. |
| `TYPES` (from `../../shared/constants/tokens`) | const object | Inversify token `TYPES.UserRepository` used for injection. |
| `NotFoundError` (from `../../shared/errors`) | class | Operational error (HTTP 404, code `NOT_FOUND`) thrown when the user is absent. |

# Exports

- `GetUserByIdHandler` (class)

# Internal Functions

See the `Function: execute` section below.

# Execution Flow

1. The DI container resolves `GetUserByIdHandler` with the bound `IUserRepository`.
2. A controller calls `await handler.execute(query)`.
3. `execute` calls `this.userRepository.findById(query.id)`.
4. If result is falsy (`null`/`undefined`) → throw `new NotFoundError('User')`.
5. Otherwise return the found `User`.

# Related Files

- `src/application/queries/get-user-by-id.query.ts` — the input contract (`GetUserByIdQuery`)
- `src/application/handlers/get-all-users.handler.ts` — sibling read handler (list)
- `src/application/handlers/index.ts` — barrel exporting this handler
- `src/domain/repositories/user-repository.interface.ts` — the port (`findById`)
- `src/domain/entities/user.entity.ts` — the `User` return type
- `src/shared/constants/tokens.ts` — `TYPES.UserRepository` token
- `src/shared/errors/index.ts` — `NotFoundError` definition
- `src/application/dto/user.dto.ts` — `userIdParamsSchema` validates the route id first

# Example Usage

```ts
import { Container } from 'inversify';
import { GetUserByIdHandler, GetUserByIdQuery } from '../application';

const handler = container.get<GetUserByIdHandler>(TYPES.GetUserByIdHandler);

const query = new GetUserByIdQuery('663c...id');
const user = await handler.execute(query);   // throws NotFoundError if missing
```

# Best Practices

- Return the domain entity and let the presentation layer serialize; the handler should not shape HTTP responses.
- Elevate `null` results to `NotFoundError` consistently with the update/delete handlers so all "resource missing" outcomes share the same 404 contract.
- Keep read handlers free of side effects (no writes, no caching logic in the handler itself).
- Validate the id shape upstream in the DTO so bad ObjectIds don't become infrastructure-level cast errors.

# Common Mistakes

- Letting the controller decide "not found" based on a nullable return, duplicating the 404 mapping in every route.
- Swallowing the result and throwing a generic error — lose the `code`/`statusCode` contract.
- Query logic leaking in: the handler should only delegate, not filter/transform entities.
- Assuming `findById` never returns `null` and dereferencing fields blindly.

# Notes For Frontend Developers

- Fetching one user → `GET /users/:id`.
- Success → 200 with the user object (`id`, `email`, `name`, `role`, `isActive`, `createdAt`, `updatedAt`).
- Unknown id → **404 Not Found** `User not found`. On a detail page, use this to show an empty/not-found state or kick back to the list.
- The handler is deliberately minimal: no caching headers are managed here — treat each fetch as fresh unless the API layer adds caching.

## Function: execute

- Location: `src/application/handlers/get-user-by-id.handler.ts:12`
- Purpose: Fetches a single user by id and maps the miss-case to a 404.
- Parameters:

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `query` | `GetUserByIdQuery` | Yes | Immutable query carrying the `id` of the user to retrieve. |

- Return Type: `Promise<User>` — the found domain user entity.
- Throws:
  - `NotFoundError` — when `userRepository.findById(query.id)` resolves falsy. Message: `'User not found'`, HTTP 404.
- Called By:
  - API controller / mediator for `GET /users/:id`.
  - CQRS query dispatcher.
  - Tests (mocked repository).
- Calls:
  - `this.userRepository.findById(query.id)`
- Execution Flow:
  1. `const user = await this.userRepository.findById(query.id)`.
  2. If `!user` → `throw new NotFoundError('User')`.
  3. Return `user`.
- Example Input:
  ```ts
  new GetUserByIdQuery('663c...id')
  ```
- Example Output:
  ```ts
  User {
    id: '663c...id',
    email: 'alice@corp.com',
    name: 'Alice',
    role: 'STAFF',
    isActive: true,
    createdAt: 2026-01-15T09:00:00.000Z,
    updatedAt: 2026-08-27T08:00:00.000Z,
  }
  ```
- Business Logic:
  - Primary-key read through the port; no filtering, pagination, or authorization gates in the handler.
  - Header-style invariant: missing record disallowed as a successful response — always a 404.
- Edge Cases:
  - Unknown id → `null` → 404.
  - Malformed id string → behavior depends on the repository's casting; validate at the DTO edge to keep it a clean 404/validation path.
  - Deleted-while-reading race → `null` → 404; client should refresh.
- Notes: Pairs 1:1 with `GetUserByIdQuery` on the read pipeline; the same 404 pattern is shared by the update/delete handlers for consistency.