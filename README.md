# Backend TWK Admin

The Woven Cloud Kitchen - Admin Backend API

## Tech Stack

- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Framework**: Express.js
- **ODM**: Mongoose
- **Database**: MongoDB (`thewovencloudkitchen`)
- **Architecture**: Clean Architecture with CQRS
- **DI**: InversifyJS
- **Docs**: Swagger / OpenAPI 3
- **Validation**: Zod
- **Logging**: Winston

## Project Structure

```
src/
├── api/                    # API Layer (Routes, Controllers)
│   ├── routes/
│   └── controllers/
│
├── application/            # Application Layer
│   ├── commands/           # Command objects (write operations)
│   ├── queries/            # Query objects (read operations)
│   ├── handlers/           # Command & Query handlers (business logic)
│   └── dto/                # Zod validation schemas + inferred types
│
├── domain/                 # Domain Layer
│   ├── entities/           # Business entities
│   ├── repositories/       # Repository interfaces (ports)
│   ├── value-objects/      # Value objects / enums
│   └── interfaces/         # CQRS contracts
│
├── infrastructure/         # Infrastructure Layer
│   ├── database/
│   │   ├── mongoose/       # DB connection
│   │   ├── models/         # Mongoose schemas/models
│   │   └── seed/           # Seed data script
│   ├── repositories/       # Mongoose repository implementations (adapters)
│   └── di/                 # InversifyJS DI container
│
├── config/                 # Environment configuration + Swagger setup
├── shared/                 # Cross-cutting concerns
│   ├── utils/              # Logger, response helpers, async handler
│   ├── constants/          # DI tokens
│   ├── errors/             # AppError hierarchy + error codes
│   ├── types/              # Shared TS types
│   └── middleware/         # Error handler, validation, auth, request logging
│
├── app.ts                  # Express application setup
└── server.ts               # Bootstrap (DB connect + HTTP server)
```

## Getting Started

### Prerequisites

- Node.js >= 20.x
- MongoDB (local or Docker)
- npm

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Key variables:

| Variable | Description | Default |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `thewovencloudkitchen` |
| `PORT` | HTTP port | `3000` |
| `JWT_SECRET` | JWT signing secret (min 16 chars) | - |

### Run with Docker (MongoDB + API)

```bash
# Start MongoDB and the API
docker compose up --build

# Run the database seed inside Docker
docker compose run --rm seed
```

### Run locally

```bash
# Seed the database with an initial admin user
npm run seed

# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## Architecture

This project follows **Clean Architecture** with the **CQRS** pattern:

### Dependency Rule

Dependencies point **inward**:

```
API → Application → Domain
         ↓
   Infrastructure (implements Domain ports)
```

- **Domain Layer**: Pure business entities and repository *interfaces* (ports). No framework/DB dependencies.
- **Application Layer**: Command/Query objects and their handlers. Orchestrates use cases against domain ports. Depends only on Domain.
- **Infrastructure Layer**: Mongoose models and repository *adapters* that implement the Domain ports. Wired via InversifyJS DI.
- **API Layer**: Express routes and controllers. Translates HTTP requests into commands/queries, invokes handlers, and formats responses.

### CQRS

- **Commands** (writes): `CreateUserCommand`, `UpdateUserCommand`, `DeleteUserCommand`
- **Queries** (reads): `GetUserByIdQuery`, `GetAllUsersQuery`
- **Handlers**: `CreateUserHandler`, `UpdateUserHandler`, `DeleteUserHandler`, `GetUserByIdHandler`, `GetAllUsersHandler`

Every request is dispatched to a dedicated handler. Read and write paths are fully separated — a command never reads and a query never mutates.

### Error Handling

- Global error-handling middleware normalizes all errors into a standard response.
- `AppError` hierarchy: `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `InternalError`.
- Standard error response shape:

```json
{
  "status": "error",
  "message": "...",
  "code": "NOT_FOUND"
}
```

## License

ISC
