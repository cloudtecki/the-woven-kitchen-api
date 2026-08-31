# CQRS Domain Contracts

> **Current status (Story 0.2):** No interface file exists. The path `src/domain/interfaces/cqrs.interface.ts` from the old TypeScript codebase was removed during the JavaScript conversion. This document describes the **planned future contract** for CQRS in plain JavaScript.

## Planned contracts

When CQRS is implemented in a future story, every command/query handler will follow two simple contracts. These will live as plain JS modules (CommonJS), not TypeScript, and will not use Inversify or any DI framework.

### Command handler contract

A command handler accepts a command DTO (write operation) and returns a result via `execute()`.

```js
/**
 * @template T - input command type
 * @template TResult - return type
 */
class CommandHandler {
  /**
   * @param {T} command
   * @returns {Promise<TResult>}
   */
  async execute(command) {
    throw new Error('Not implemented');
  }
}
```

| Member | Type | Purpose |
| --- | --- | --- |
| `execute` | `(command: T) => Promise<TResult>` | Performs a state-changing operation and returns the result. |

### Query handler contract

A query handler accepts a query DTO (read operation) and returns data via `execute()`.

```js
/**
 * @template TInput - query input type
 * @template TOutput - query result type
 */
class QueryHandler {
  /**
   * @param {TInput} query
   * @returns {Promise<TOutput>}
   */
  async execute(query) {
    throw new Error('Not implemented');
  }
}
```

| Member | Type | Purpose |
| --- | --- | --- |
| `execute` | `(query: TInput) => Promise<TOutput>` | Performs a read-only lookup and returns data. |

## Design principles

- **Commands and Queries are plain data.** They are serializable DTOs with no behavior — no database access, no business rules, just fields.
- **Handlers own ALL logic.** Business rules, validation, error handling, and repository calls live exclusively in the handler's `execute()` method.
- **Uniform dispatch shape.** Every operation goes through `handler.execute(dto)`, making the codebase predictable and easy to extend.
- **No DI framework.** Handlers will receive their dependencies (repositories) via constructor injection — plain JavaScript, no decorators, no container.

## How this will work (future example)

When a concrete operation is added (e.g. creating an order):

1. Define the DTO in `src/application/commands/`:
   ```js
   // src/application/commands/create-order.command.js
   class CreateOrderCommand {
     constructor({ productId, quantity }) {
       this.productId = productId;
       this.quantity = quantity;
     }
   }
   module.exports = { CreateOrderCommand };
   ```

2. Implement the handler in `src/application/handlers/`:
   ```js
   // src/application/handlers/create-order.handler.js
   class CreateOrderHandler {
     constructor(orderRepository) {
       this.orderRepository = orderRepository;
     }

     async execute(command) {
       // business logic, validation, persistence
       return this.orderRepository.create(command);
     }
   }
   module.exports = { CreateOrderHandler };
   ```

3. The Express route builds the DTO and calls `handler.execute(dto)`.

## Key difference from old TypeScript implementation

The previous codebase used TypeScript interfaces (`Command<T, TResult>`, `Query<TInput, TOutput>`), `@injectable()` decorators, `@inject(TYPES.UserRepository)` for DI via Inversify, and `reflect-metadata`. **None of these exist in the current JavaScript codebase.** The future implementation will be plain CommonJS modules with constructor-based dependency injection — simpler, no build-step required, no decorators.
