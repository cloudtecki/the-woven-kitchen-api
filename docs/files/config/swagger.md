# File Name
`swagger.js`

# File Path
`D:\real-time-project\twk\backend-twk-admin\src\config\swagger.js`

# Purpose
Generates and exports the OpenAPI (Swagger) specification for the API using `swagger-jsdoc`. The spec is served by Swagger UI at `/api-docs`. Plain JavaScript (CommonJS — `require` / `module.exports`).

# Responsibilities
- Define the OpenAPI 3.0.0 document: title, version, description, and development server URL.
- Declare shared components/schemas (`Health`, `ApiError`).
- Declare API paths (currently the health check path).
- Generate the `swaggerSpec` via `swaggerJsdoc(options)` and export it.

# Exports
- `swaggerSpec` — the generated OpenAPI document object (CommonJS `module.exports = { swaggerSpec }`).

# Internal Functions
- None (the `options` object and computed `swaggerSpec` are module constants).

# Execution Flow
1. `swaggerJsdoc` is imported and `config` is loaded.
2. `options.definition` describes OpenAPI metadata, servers, components, and paths.
3. `apis: ['./src/app.js']` instructs swagger-jsdoc to scan source files for JSDoc annotations.
4. `swaggerSpec = swaggerJsdoc(options)` builds the spec.
5. The spec is exported and consumed by `app.js` for Swagger UI.

# Related Files
- `src/config/index.js` — provides `config.port` for the server URL.
- `src/app.js` — serves the spec at `/api-docs` via `swagger-ui-express`.

# Documented Schema
- `Health` — `{ status: string }`, example `OK`.
- `ApiError` — `{ success: boolean, message: string, code: string }`.

# Documented Path
- `GET /api/health` — health check, tag `System`, 200 response referencing `Health`.

# Example Usage
```javascript
// app.js
const { swaggerSpec } = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

# Best Practices
- Keep the spec centralized and in sync with route definitions.
- Document request/response schemas as components for reuse.

# Common Mistakes
- Letting the spec drift from the actual routes (adding paths without implementing or documenting them).
- Hard-coding the server port instead of reading `config.port`.

# Notes For Frontend Developers
- Interactive API docs are available at `http://localhost:<port>/api-docs`.
- The `ApiError` schema documents the error envelope `{ success:false, message, code }` used by all error responses.
