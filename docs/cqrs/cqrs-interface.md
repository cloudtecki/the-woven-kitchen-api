# CQRS Domain Contracts

## File Path

`src/domain/interfaces/cqrs.interface.ts`

The domain layer defines the two **contracts** that every command, query and handler conforms to. They live at the heart of the CQRS implementation in this project.

## The Contracts

```ts
export interface Command<T = void, TResult = void> {
  execute(data: T): Promise<TResult>;
}

export interface Query<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

## Members

### `Command<T, TResult>`

| Member    | Type                  | Purpose                                                                    |
| --------- | --------------------- | -------------------------------------------------------------------------- |
| `execute` | `(data: T) => Promise<TResult>` | Performs a state-changing operation. Defaults: `T = void`, `TResult = void`. |

`T` is the input payload (the command data) and `TResult` is the value returned after the mutation (often the created/updated entity).

### `Query<TInput, TOutput>`

| Member    | Type                                    | Purpose                                     |
| --------- | --------------------------------------- | ------------------------------------------- |
| `execute` | `(input: TInput) => Promise<TOutput>` | Performs a read-only lookup and returns data. |

`TInput` is the query's input payload and `TOutput` is the result type returned to the caller.

## The Purpose of the Contracts

- They **formalize a uniform message-passing shape**: everything in the application layer is dispatched through an `execute(...)` method that takes data and returns a `Promise`.
- They provide **type safety** across the layers — a handler's `execute` signature is tied to the exact command/query it owns.
- They make the codebase **predictable and easy to extend**: adding a new business operation means adding a new data class (command/query) plus a new handler that implements the same `execute` contract. No other code needs to change.

## How the Codebase Uses Them

Although the concrete command/query classes and handlers do **not** literally `implements Command<...>` / `Query<...>` (they use container-injected handlers with an `execute(command)` method), they all **follow the same shape** the interfaces describe:

### Data classes (commands & queries)

Declared in `src/application/commands/` and `src/application/queries/`. They are **plain data** with `public readonly` constructor fields — no behavior, no methods beyond a constructor.

```ts
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly role?: UserRole
  ) {}
}
```

### Handlers

Declared in `src/application/handlers/`. Each handler exposes an `execute(...)` method matching the contract's signature and resolves a repository via the DI container (`@injectable`, `@inject(TYPES.UserRepository)`).

```ts
@injectable()
export class CreateUserHandler {
  constructor(@inject(TYPES.UserRepository) private userRepository: IUserRepository) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // ...business logic...
  }
}
```

### Controllers dispatch to handlers

Controllers (`src/api/controllers/`) build a command/query **data object** and pass it straight to the matching `handler.execute(...)`:

```ts
// read path (a Query)
const user = await getUserByIdHandler().execute(new GetUserByIdQuery(id));

// write path (a Command)
const user = await createUserHandler().execute(new CreateUserCommand(data.email, data.name, data.role));
```

## Key Design Point: Commands/Queries are Plain Data, Handlers Own Logic

This is the most important rule of this implementation:

- **Commands and Queries contain ONLY data.** They are serializable, immutable DTOs. They have no methods that perform work, no access to the database, and no behavior.
- **Handlers own ALL the logic.** Business rules, validation, error handling, and orchestration of repository calls live exclusively in the matching handler.

This separation keeps the data layer dumb (easy to serialize, send over the network, or log) and centralizes behavior (easy to test, easy to change business rules without touching the HTTP or database layers). If you need to change *how* a user is created, you edit the handler — never the command class.
