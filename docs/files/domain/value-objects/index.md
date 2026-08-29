# File Name
`index.ts`

# File Path
`src\domain\value-objects\index.ts`

# Purpose
Barrel (index) file for the domain **value-objects** sub-module. It re-exports all public value objects so consumers can import them from a single location (`src/domain/value-objects`).

# Responsibilities
- Re-export everything from `./user-role`.
- Provide a clean, stable import surface for value objects.
- Shield consumers from the underlying file layout.

# Dependencies
| Import | Explanation |
|--------|-------------|
| `./user-role` | Defines and exports the `UserRole` enum. |

# Exports
| Export | Kind | Description |
|--------|------|-------------|
| `UserRole` | Enum | The user role value object (ADMIN/MANAGER/STAFF). |

# Internal Functions
None. Re-export only; no logic.

# Execution Flow
1. Resolves and loads `./user-role`.
2. Re-exports all its public symbols.
3. The aggregated symbols become available through `src/domain/value-objects`.

# Related Files
- `src\domain\value-objects\user-role.ts`
- `src\domain\index.ts` — parent barrel re-exporting this module.

# Example Usage
```ts
import { UserRole } from '@domain/value-objects';
```

# Best Practices
- Only re-export; never add logic to this barrel.
- Add a new re-export line whenever a new value-object file is added.

# Common Mistakes
- Forgetting to update this barrel after adding a new value object.
- Importing from the parent `src/domain` barrel inside value-object files (use relative paths).

# Notes For Frontend Developers
- Value objects here are type-only (via the enum); importing `UserRole` is just a named constant reference and adds no runtime weight.
