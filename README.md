# Backend TWK Admin

The Woven Cloud Kitchen - Admin Backend API

## Tech Stack

- **Runtime**: Node.js 20 (JavaScript, no TypeScript)
- **Framework**: Express.js
- **ODM**: Mongoose
- **Database**: MongoDB (`thewovencloudkitchen`)
- **Architecture**: Clean Architecture with CQRS (plain JS modules)
- **Docs**: Swagger / OpenAPI 3 (`/api-docs`)
- **Validation**: Zod
- **Logging**: Winston

## Project Structure

```
src/
├── api/                    # API Layer
│   ├── routes/             # Express routers (e.g. health)
│   ├── controllers/        # HTTP controllers (future CQRS)
│   ├── middlewares/        # requestLogger, validate, errorHandler
│   └── docs/               # API documentation assets
│
├── application/            # Application Layer (future CQRS)
│   ├── commands/
│   ├── queries/
│   ├── handlers/
│   ├── dto/
│   └── services/
│
├── domain/                 # Domain Layer (future business entities)
│   ├── entities/
│   ├── repositories/
│   └── value-objects/
│
├── infrastructure/         # Infrastructure Layer
│   ├── database/
│   │   ├── mongoose/       # DB connection (connectDB/disconnectDB)
│   │   └── models/         # Mongoose schemas/models (future)
│   ├── repositories/       # Repository adapters (future)
│   └── config/
│
├── config/                 # Env configuration (Zod) + Swagger
├── shared/                 # Cross-cutting concerns
│   ├── utils/              # logger, response helpers, asyncHandler
│   ├── constants/          # error codes
│   └── errors/             # AppError + error classes
│
├── app.js                  # Express application setup
└── server.js               # Bootstrap (DB connect + HTTP server + shutdown)
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
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/thewovencloudkitchen` |
| `DB_NAME` | Database name | `thewovencloudkitchen` |
| `PORT` | HTTP port | `3000` |
| `API_PREFIX` | API route prefix | `/api` |
| `LOG_LEVEL` | Winston log level | `info` |

### Run with Docker (MongoDB + API)

```bash
docker compose up --build
```

### Run locally

```bash
# Development (hot reload)
npm run dev

# Production
npm start
```

No build step is required — the backend is plain JavaScript run directly by Node.

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/api/health

## Architecture

This project follows **Clean Architecture** and is structured for the **CQRS** pattern.
Layers are separated by folder and dependencies point inward:

```
API → Application → Domain
         ↓
   Infrastructure (implements Domain ports)
```

- **Domain Layer**: business entities and repository contracts. No framework/DB dependencies.
- **Application Layer**: commands, queries, handlers, DTOs. Orchestrates use cases.
- **Infrastructure Layer**: Mongoose connection, models, and repository adapters.
- **API Layer**: Express routes, controllers, and middlewares.

Story 0.2 prepares the folder structure for future CQRS commands/queries/handlers; no
business-specific entities are introduced yet. The `domain/application` folders are placeholders.

### Error Handling

- Global error-handling middleware normalizes all errors into a standard response.
- `AppError` hierarchy: `NotFoundError`, `ValidationError`, `ConflictError`, `InternalError`.
- Standard error response shape:

```json
{
  "success": false,
  "message": "...",
  "code": "NOT_FOUND"
}
```

## License

ISC
