'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const { config } = require('./index');

const api = config.apiPrefix;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TWK Admin API',
      version: '1.0.0',
      description: 'The Woven Cloud Kitchen - Admin Backend API',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Health: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'OK' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string', example: '9876543210' },
            role: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] },
            bio: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' },
          },
        },
        SignupRequest: {
          type: 'object',
          required: ['name', 'email', 'phone', 'password'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', example: '9876543210' },
            password: { type: 'string', format: 'password' },
            bio: { type: 'string' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', format: 'password' },
            newPassword: { type: 'string', format: 'password' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string', example: '9876543210' },
            bio: { type: 'string' },
          },
        },
        AdminUpdateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string', example: '9876543210' },
            bio: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] },
            isActive: { type: 'boolean' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        UserListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            pagination: { $ref: '#/components/schemas/Pagination' },
          },
        },
      },
    },
    paths: {
      [`${api}/health`]: {
        get: {
          summary: 'Health check',
          tags: ['System'],
          responses: {
            200: {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Health' },
                },
              },
            },
          },
        },
      },
      [`${api}/auth/signup`]: {
        post: {
          summary: 'Register a new customer account',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SignupRequest' } },
            },
          },
          responses: {
            201: {
              description: 'Account created. Role is always CUSTOMER.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            400: { description: 'Validation error (e.g. phone required/invalid)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
            409: { description: 'Email or phone already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          },
        },
      },
      [`${api}/auth/login`]: {
        post: {
          summary: 'Login and receive a JWT',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
              },
            },
            401: { description: 'Invalid credentials or deactivated account', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          },
        },
      },
      [`${api}/auth/change-password`]: {
        patch: {
          summary: 'Change the authenticated user\'s password',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } },
            },
          },
          responses: {
            200: { description: 'Password changed' },
            400: { description: 'Validation error' },
            401: { description: 'Missing/invalid token or wrong current password', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          },
        },
      },
      [`${api}/users/me`]: {
        get: {
          summary: 'Get the authenticated user\'s profile',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          },
        },
        patch: {
          summary: "Update the authenticated user's name, phone or bio",
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } },
            },
          },
          responses: {
            200: { description: 'Profile updated' },
            400: { description: 'Validation error (phone cannot be removed/invalid)' },
            401: { description: 'Authentication required' },
          },
        },
      },
      [`${api}/users`]: {
        get: {
          summary: 'List users (admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            { in: 'query', name: 'role', schema: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] } },
            { in: 'query', name: 'isActive', schema: { type: 'string', enum: ['true', 'false'] } },
          ],
          responses: {
            200: {
              description: 'Paginated user list',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/UserListResponse' } },
              },
            },
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
          },
        },
      },
      [`${api}/users/{id}`]: {
        get: {
          summary: 'Get a user by id (admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'User' },
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
            404: { description: 'User not found' },
          },
        },
        patch: {
          summary: 'Update a user (admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AdminUpdateUserRequest' } },
            },
          },
          responses: {
            200: { description: 'User updated' },
            400: { description: 'Validation error (phone cannot be null/empty)' },
            401: { description: 'Authentication required' },
            403: { description: 'Access denied or self-protection rule' },
            404: { description: 'User not found' },
          },
        },
        delete: {
          summary: 'Delete a user (admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'User deleted' },
            401: { description: 'Authentication required' },
            403: { description: 'Access denied or cannot delete self' },
            404: { description: 'User not found' },
          },
        },
      },
      [`${api}/menu/tomorrow`]: {
        get: {
          summary: "View tomorrow's menu (admin + customer)",
          tags: ['Menu'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Tomorrow menu (empty until menu sprint)' },
            401: { description: 'Authentication required' },
          },
        },
      },
      [`${api}/menu`]: {
        post: {
          summary: 'Create menu item (admin only)',
          tags: ['Menu'],
          security: [{ bearerAuth: [] }],
          responses: {
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
            501: { description: 'Not implemented in this sprint' },
          },
        },
      },
      [`${api}/menu/{id}`]: {
        patch: {
          summary: 'Update menu item (admin only)',
          tags: ['Menu'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
            501: { description: 'Not implemented in this sprint' },
          },
        },
        delete: {
          summary: 'Delete menu item (admin only)',
          tags: ['Menu'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
            501: { description: 'Not implemented in this sprint' },
          },
        },
      },
      [`${api}/orders`]: {
        post: {
          summary: 'Place an order (admin + customer)',
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          responses: {
            401: { description: 'Authentication required' },
            501: { description: 'Not implemented in this sprint' },
          },
        },
        get: {
          summary: 'List orders (customer sees own, admin sees all)',
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Paginated order list (empty until orders sprint)' },
            401: { description: 'Authentication required' },
          },
        },
      },
      [`${api}/orders/{id}`]: {
        get: {
          summary: 'Get an order (own order for customer, any for admin)',
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            401: { description: 'Authentication required' },
            404: { description: 'Order not found' },
          },
        },
        patch: {
          summary: 'Update order status (admin only)',
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
            501: { description: 'Not implemented in this sprint' },
          },
        },
      },
    },
  },
  apis: ['./src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };