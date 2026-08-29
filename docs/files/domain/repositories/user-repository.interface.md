# File Name
`user-repository.interface.ts`

# File Path
`src\domain\repositories\user-repository.interface.ts`

# Purpose
Defines the data-access contract for users: the `IUserRepository` interface along with its supporting Data Transfer Object (DTO) interfaces (`CreateUserData`, `UpdateUserData`, `FindAllResult`). It decouples the domain/application layer from any concrete persistence implementation (Mongoose, in-memory, etc.).

# Responsibilities
- Declare the complete set of persistence operations available for users (CRUD + query + count).
- Define type-safe input/output shapes for each operation.
- Keep the domain independent of MongoDB/Mongoose specifics by using plain Promise-based signatures.
- Allow multiple concrete implementations (Mongo, mock, test doubles) to satisfy the same contract.
- Make pagination explicit via the `FindAllResult` shape.

# Dependencies
| Import | Explanation |
|--------|-------------|
| `User` from `../entities/user.entity` | The entity type used as the return type for read operations and in result shapes. |
| `UserRole` from `../value-objects/user-role` | The enum type used in `CreateUserData` and `UpdateUserData` for the `role` field. |

# Exports
| Export | Kind | Description |
|--------|------|-------------|
| `CreateUserData` | Interface | Input payload for creating a user. |
| `UpdateUserData` | Interface | Partial payload for updating a user (all fields optional). |
| `FindAllResult` | Interface | Paginated result shape returned by `findAll`. |
| `IUserRepository` | Interface | The user repository contract. |

## Interface: `CreateUserData`
- Location: `src\domain\repositories\user-repository.interface.ts:4`
- Purpose: Defines the required fields to create a new user record.
- Members:

| Member | Type | Required | Description |
|--------|------|----------|-------------|
| `email` | `string` | Yes | The new user's email address. |
| `name` | `string` | Yes | The new user's name. |
| `role` | `UserRole` | Yes | The new user's role (ADMIN/MANAGER/STAFF). |
| `isActive` | `boolean` | Yes | The initial active status of the new user. |

## Interface: `UpdateUserData`
- Location: `src\domain\repositories\user-repository.interface.ts:11`
- Purpose: Defines the updatable fields for an existing user. Every member is optional so partial updates are supported.
- Members:

| Member | Type | Required | Description |
|--------|------|----------|-------------|
| `email` | `string` | No | New email address; if omitted, the email is not changed. |
| `name` | `string` | No | New name; if omitted, the name is not changed. |
| `role` | `UserRole` | No | New role; if omitted, the role is not changed. |
| `isActive` | `boolean` | No | New active status; if omitted, the status is not changed. |

## Interface: `FindAllResult`
- Location: `src\domain\repositories\user-repository.interface.ts:18`
- Purpose: Represents a paginated listing of users, including the page data and the total count of records.
- Members:

| Member | Type | Required | Description |
|--------|------|----------|-------------|
| `data` | `User[]` | Yes | The array of users on the current page. |
| `total` | `number` | Yes | The total number of user records (across all pages). |

## Interface: `IUserRepository`
- Location: `src\domain\repositories\user-repository.interface.ts:23`
- Purpose: The contract for any user repository implementation. All operations return Promises to remain asynchronous.
- Members:

| Member | Type | Required | Description |
|--------|------|----------|-------------|
| `findById(id)` | `(id: string) => Promise<User \| null>` | Yes | Finds a single user by its id; returns `null` if not found. |
| `findByEmail(email)` | `(email: string) => Promise<User \| null>` | Yes | Finds a single user by its email; returns `null` if not found. |
| `findAll(page?, limit?)` | `(page?: number, limit?: number) => Promise<FindAllResult>` | Yes | Returns a paginated result. `page` is 1-based (or the first page if omitted); `limit` defines page size (or a default if omitted). |
| `create(data)` | `(data: CreateUserData) => Promise<User>` | Yes | Creates and returns a new user from the given data. |
| `update(id, data)` | `(id: string, data: UpdateUserData) => Promise<User \| null>` | Yes | Updates an existing user by id; returns the updated user, or `null` if the user does not exist. |
| `delete(id)` | `(id: string) => Promise<boolean>` | Yes | Deletes a user by id; returns `true` on success / `false` if not found. |
| `count()` | `() => Promise<number>` | Yes | Returns the total number of user records. |

# Internal Functions
None. `IUserRepository` is an interface whose methods are implemented by concrete repository classes (in the infrastructure layer).

# Execution Flow
Each method is a contract, not an implementation:
1. The application/service layer calls a repository method.
2. The concrete implementation (e.g. a Mongoose-based repository) translates the call into the underlying database operation.
3. Results are mapped back into domain `User` objects (or primitive results like `boolean`/`number`) before the Promise resolves.

# Related Files
- `src\domain\entities\user.entity.ts` — the `User` entity used in signatures.
- `src\domain\value-objects\user-role.ts` — the `UserRole` enum.
- `src\domain\repositories\index.ts` — barrel re-exporting these types.
- Corresponding concrete implementations live in the infrastructure/data layer (not in domain).

# Example Usage
```ts
import { IUserRepository, CreateUserData, UserRole } from '@domain/repositories';

async function registerUser(repo: IUserRepository, email: string, name: string) {
  const input: CreateUserData = { email, name, role: UserRole.STAFF, isActive: true };
  const user = await repo.create(input);
  const all = await repo.findAll(1, 20); // { data: User[], total: number }
  return user;
}
```

# Best Practices
- Program against `IUserRepository`, not a concrete class, so implementations can be swapped (real DB vs. in-memory/test double).
- Honor the `null` return conventions for `findById`, `findByEmail`, and `update` — callers use these to detect missing records.
- Validate that `page`/`limit` are positive integers before relying on pagination behavior.
- Keep the interface free of persistence-specific types (never expose Mongoose documents here).

# Common Mistakes
- Returning Mongoose/ORM document types instead of domain `User` objects.
- Assuming `findAll` has particular default paging behavior without checking the implementation.
- Ignoring the `null`/`false` failure signals and treating them as errors.
- Adding persistence-specific methods (e.g. `aggregate`, `rawQuery`) to the domain interface.

# Notes For Frontend Developers
- When the API exposes these operations, a `create` call corresponds to a `POST`, `update` to `PUT/PATCH`, `delete` to `DELETE`, and `findById`/`findAll` to `GET`.
- `findAll` typically returns a shape like `{ data: [...], total: n }` — use `total` for your pagination component's page-count calculation and `data` for the table/list.
- The `User | null` semantics mean a missing user surfaces as `null` (empty body / 404) rather than a thrown error; handle it in your UI as a "not found" state.
