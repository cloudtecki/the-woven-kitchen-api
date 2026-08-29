# File Name
`base.entity.ts`

# File Path
`src\domain\entities\base.entity.ts`

# Purpose
Defines the `BaseEntity` interface, which is the foundation type that every domain entity in the system extends. It captures the common, framework-agnostic fields shared by all persisted entities (identity and audit timestamps).

# Responsibilities
- Declare the mandatory `id` field for every entity.
- Declare the `createdAt` and `updatedAt` timestamp fields.
- Serve as a single extensible contract so that all entities share a consistent shape.
- Keep persistence concerns (e.g. MongoDB `_id`) out of the entity's public surface; the concrete `id` mapping is handled elsewhere (infrastructure layer).

# Dependencies
| Import | Explanation |
|--------|-------------|
| *(none)* | This file imports nothing. It is self-contained and depends only on built-in TypeScript primitives (`string`, `Date`). |

# Exports
| Export | Kind | Description |
|--------|------|-------------|
| `BaseEntity` | Interface | Base contract for all domain entities. |

## Interface: `BaseEntity`
- Location: `src\domain\entities\base.entity.ts:1`
- Purpose: The base shape every domain entity must implement, providing identity and audit fields.
- Members:

| Member | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | `string` | Yes | The unique identifier of the entity. Maps to the persisted primary key (e.g. MongoDB `_id` string) at the infrastructure layer. |
| `createdAt` | `Date` | Yes | Timestamp indicating when the entity was first created/persisted. |
| `updatedAt` | `Date` | Yes | Timestamp indicating the last time the entity was modified. |

# Internal Functions
None. `BaseEntity` is a pure interface with no functions.

# Execution Flow
N/A — a type-only declaration. It has no runtime execution; it is erased at compile time and used only for compile-time type checking.

# Related Files
- `src\domain\entities\user.entity.ts` — `User` extends `BaseEntity`.
- `src\domain\entities\index.ts` — barrel that re-exports `BaseEntity`.
- `src\domain\index.ts` — layer root barrel.

# Example Usage
```ts
import { BaseEntity } from '@domain';

// Extend the base for a new entity
export interface Shop extends BaseEntity {
  name: string;
  address: string;
}

function formatUserIdentity(entity: BaseEntity): string {
  return `${entity.id} @ ${entity.updatedAt.toISOString()}`;
}
```

# Best Practices
- Always extend `BaseEntity` when defining a new domain entity rather than re-declaring the three base fields.
- Treat `id`, `createdAt`, `updatedAt` as read-only from the perspective of domain logic; mutate them only in the infrastructure/persistence layer.
- Prefer domain-meaningful `id` strings; do not leak Mongo `ObjectId` details into the domain.

# Common Mistakes
- Duplicating `id`/timestamps in every entity instead of extending `BaseEntity`.
- Exposing persistence-specific concepts (e.g. `_id`, Mongoose documents) directly on the entity interface.

# Notes For Frontend Developers
- `id` is always a `string` on the wire. If your API returns timestamp strings, map them to `Date` objects before assigning to `createdAt`/`updatedAt`.
- Because timestamps are `Date` objects, format them client-side (e.g. `toLocaleString`) rather than relying on raw server formatting.
