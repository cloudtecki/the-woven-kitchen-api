# File Name
`user-role.ts`

# File Path
`src\domain\value-objects\user-role.ts`

# Purpose
Defines the `UserRole` enum, the value object that enumerates the set of roles a user can hold in the system. It constrains the `role` field on the `User` entity to a fixed, type-safe set of values.

# Responsibilities
- Enumerate the allowed user roles: `ADMIN`, `MANAGER`, `STAFF`.
- Provide a single source of truth for role values used across the codebase.
- Enable type-safe role comparisons and assignments.
- Prevent typos and invalid roles by replacing magic strings with named constants.

# Dependencies
| Import | Explanation |
|--------|-------------|
| *(none)* | This file imports nothing. It relies only on the TypeScript `enum` construct. |

# Exports
| Export | Kind | Description |
|--------|------|-------------|
| `UserRole` | Enum | The user role value object. |

## Enum: `UserRole`
- Location: `src\domain\value-objects\user-role.ts:1`
- Purpose: Represents the valid roles assignable to a user in the admin system.
- Values:

| Member | Value | Description |
|--------|-------|-------------|
| `ADMIN` | `'ADMIN'` | Administrator role — full elevated/system-level access. |
| `MANAGER` | `'MANAGER'` | Manager role — elevated operations, subordinate to ADMIN. |
| `STAFF` | `'STAFF'` | Staff role — standard/basic access. |

> Note: This is a string enum, so the runtime value equals the member name (`UserRole.ADMIN === 'ADMIN'`). This makes the values JSON-serializable and wire-friendly.

# Internal Functions
None. An enum has no executable functions.

# Execution Flow
N/A — an enum is a data declaration. At runtime, TypeScript compiles it into an object mapping member names to values; it is used for type-safe assignment and comparison.

# Related Files
- `src\domain\entities\user.entity.ts` — the `User.role` field is typed as `UserRole`.
- `src\domain\repositories\user-repository.interface.ts` — `CreateUserData.role` and `UpdateUserData.role` are typed as `UserRole`.
- `src\domain\value-objects\index.ts` — barrel re-exporting this enum.

# Example Usage
```ts
import { UserRole } from '@domain/value-objects';

function canDelete(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

const role: UserRole = UserRole.MANAGER;
```

# Best Practices
- Always reference roles via `UserRole.X` rather than raw strings to guarantee type safety and avoid typos.
- Extend this enum (rather than adding ad-hoc strings) whenever a new role is needed, and propagate to authorization logic.
- Remember this is a string enum — the stored/transmitted value is the plain string (`'ADMIN'`), useful for DB and API interop.

# Common Mistakes
- Comparing with string literals (e.g. `role === 'admin'` with wrong casing) — this silently fails; use `UserRole.ADMIN`.
- Storing a different value than the enum (e.g. lowercased) in the database, causing deserialization mismatches.
- Forgetting to update authorization rules when adding a new enum value.

# Notes For Frontend Developers
- When a user object arrives from the API, `role` will be one of the strings `'ADMIN'`, `'MANAGER'`, `'STAFF'`. Match feature toggles and UI labels against these exact strings.
- If you mirror this enum on the frontend (e.g. in a shared types package), keep the string values identical so server/client comparisons match.
- Use `role` to drive conditional UI: hide/show admin controls, disable actions, and customize greeting/badges.
