# File Name
`user.entity.ts`

# File Path
`src\domain\entities\user.entity.ts`

# Purpose
Defines the `User` domain entity, representing a user of the admin backend application. It extends `BaseEntity` and adds the user-specific business fields (email, name, role, active status).

# Responsibilities
- Extend `BaseEntity` with the fields that identify a user.
- Hold the `email` used for identification and contact.
- Hold the `name` (display/full name) of the user.
- Hold the `role` via the `UserRole` value object to scope permissions.
- Hold the `isActive` flag representing whether the account is enabled/active.
- Provide a persistence-agnostic representation of a user for use across all layers.

# Dependencies
| Import | Explanation |
|--------|-------------|
| `BaseEntity` from `./base.entity` | The base interface that `User` extends; supplies `id`, `createdAt`, `updatedAt`. |
| `UserRole` from `../value-objects/user-role` | The enum used to type the `role` field, constraining roles to `ADMIN`, `MANAGER`, or `STAFF`. |

# Exports
| Export | Kind | Description |
|--------|------|-------------|
| `User` | Interface | The user domain entity. |

## Interface: `User`
- Location: `src\domain\entities\user.entity.ts:4`
- Purpose: Represents a user entity in the domain layer, used as the canonical in-memory/transport shape across services, repositories, and handlers.
- Extends: `BaseEntity`
- Members:

| Member | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | `string` | Yes (inherited) | Unique identifier, from `BaseEntity`. |
| `createdAt` | `Date` | Yes (inherited) | Creation timestamp, from `BaseEntity`. |
| `updatedAt` | `Date` | Yes (inherited) | Last-updated timestamp, from `BaseEntity`. |
| `email` | `string` | Yes | The user's email address; used as a unique identifier and contact point. |
| `name` | `string` | Yes | The user's display/full name. |
| `role` | `UserRole` | Yes | The user's role; one of `ADMIN`, `MANAGER`, `STAFF`. |
| `isActive` | `boolean` | Yes | Whether the user account is active/enabled. |

# Internal Functions
None. `User` is a pure interface with no functions.

# Execution Flow
N/A — a type-only declaration. `User` is erased at compile time; it provides no runtime behavior and is used purely for static typing.

# Related Files
- `src\domain\entities\base.entity.ts` — parent interface.
- `src\domain\value-objects\user-role.ts` — the `UserRole` enum used by the `role` field.
- `src\domain\entities\index.ts` — barrel that re-exports `User`.
- `src\domain\repositories\user-repository.interface.ts` — repository operations return/produce `User`.

# Example Usage
```ts
import { User, UserRole } from '@domain';

const admin: User = {
  id: 'usr_123',
  email: 'admin@example.com',
  name: 'Admin User',
  role: UserRole.ADMIN,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function isPrivileged(user: User): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
}
```

# Best Practices
- Always create users through the repository and services, never bypass validation with raw objects.
- Prefer the `UserRole` enum over string literals so role comparisons are type-safe.
- Keep `isActive` semantics clear: an inactive user is excluded from authorization even if their credentials are valid.

# Common Mistakes
- Placing API-specific fields (id as Mongo `_id`, document metadata) on the entity directly.
- Comparing `role` with raw strings (`'ADMIN'`) instead of `UserRole.ADMIN`.
- Treating `email` as mutable without going through a validated update path (it may be a login identifier).

# Notes For Frontend Developers
- `role` will serialize to one of `'ADMIN'`, `'MANAGER'`, `'STAFF'` — reconcile your UI copy and badge styles against these exact values.
- `isActive` should drive UI state such as disabled account badges, login blocking messages, and role-based permissions.
- Timestamps arrive as ISO strings from JSON APIs; convert to `Date` for formatting.
