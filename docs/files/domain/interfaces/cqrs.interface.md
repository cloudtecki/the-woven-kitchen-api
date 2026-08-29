# File Name
`cqrs.interface.ts`

# File Path
`src\domain\interfaces\cqrs.interface.ts`

# Purpose
Defines the generic CQRS (Command Query Responsibility Segregation) contracts used throughout the application: the `Command` interface and the `Query` interface. They split writes (commands) from reads (queries) behind a common `execute(...)` shape.

# Responsibilities
- Define `Command<T, TResult>` for write/intent operations that mutate state.
- Define `Query<TInput, TOutput>` for read operations that return data without side effects.
- Enforce a single uniform `execute(...)` method signature for both concepts.
- Provide sensible generic defaults (`T = void`, `TResult = void`) for commands that take no payload.
- Decouple the application/domain logic from any concrete CQRS bus implementation.

# Dependencies
| Import | Explanation |
|--------|-------------|
| *(none)* | This file imports nothing; it relies only on the TypeScript `Promise` global and generics. |

# Exports
| Export | Kind | Description |
|--------|------|-------------|
| `Command<T, TResult>` | Interface | Generic contract for write/command operations. |
| `Query<TInput, TOutput>` | Interface | Generic contract for read/query operations. |

## Interface: `Command<T = void, TResult = void>`
- Location: `src\domain\interfaces\cqrs.interface.ts:1`
- Purpose: Contract representing a command — an operation that expresses intent to change state. It has a single `execute` method.
- Type Parameters:
  - `T` (default `void`): The type of the payload passed to `execute`. Defaults to `void` so commands without input are ergonomic.
  - `TResult` (default `void`): The type returned by `execute`. Defaults to `void` so commands may produce no result.
- Members:

| Member | Type | Required | Description |
|--------|------|----------|-------------|
| `execute` | `(data: T) => Promise<TResult>` | Yes | Executes the command with the given input and returns a promise resolving to the result. |

## Interface: `Query<TInput, TOutput>`
- Location: `src\domain\interfaces\cqrs.interface.ts:5`
- Purpose: Contract representing a query — a read-only operation that returns data without causing side effects. It has a single `execute` method.
- Type Parameters:
  - `TInput`: The type of the input passed to `execute` (e.g. an id, paging options, filter object).
  - `TOutput`: The type of the result returned by `execute`.
- Members:

| Member | Type | Required | Description |
|--------|------|----------|-------------|
| `execute` | `(input: TInput) => Promise<TOutput>` | Yes | Executes the query with the given input and returns a promise resolving to the typed output. |

# Internal Functions
None. These are pure generic interfaces.

# Execution Flow
- `Command.execute`: When called, the implementing handler (an application-layer command handler) performs a write operation and returns its result. Because it returns a `Promise`, execution is asynchronous.
- `Query.execute`: When called, the implementing handler performs a read operation (typically via a repository) and returns the requested data.
- Neither interface dictates WHERE executions happen — concrete implementations live in the application layer; these contracts only enforce the shape.

# Related Files
- `src\domain\interfaces\index.ts` — barrel re-exporting these interfaces.
- `src\domain\index.ts` — layer root barrel.

# Example Usage
```ts
import { Command, Query } from '@domain/interfaces';

// Command with no input payload and no result
class CreateAuditLogCommand implements Command<void, void> {
  async execute(): Promise<void> {
    // write side effect
  }
}

// Query that takes an id and returns a user
class GetUserQuery implements Query<string, User | null> {
  async execute(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }
}
```

# Best Practices
- Implement commands for anything that mutates state; implement queries for anything that reads state.
- Keep commands/query method names/behavior generic and side-effect transparent (queries must not mutate).
- Use explicit type parameters so the payload and result are fully typed; this makes handlers type-safe and self-documenting.
- Keep domain/application logic behind these contracts so the transport or bus layer can dispatch uniformly.

# Common Mistakes
- Making a query perform writes (violates CQRS separation and these contracts' intent).
- Using a single interface for both commands and queries instead of honoring the write/read split.
- Over-using the default `void` types and losing meaningful return types for queries.

# Notes For Frontend Developers
- When you call a backend endpoint, a `Command` typically corresponds to a `POST/PUT/DELETE` (write) and a `Query` to a `GET` (read) — but these interfaces live entirely on the backend. On the frontend, mirror this pattern (e.g. service methods named `createUser` vs `getUser`) for consistency.
