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
        MenuVariant: {
          type: 'object',
          required: ['label', 'price'],
          properties: {
            label: { type: 'string' },
            price: { type: 'number' },
            offerPrice: { type: 'number' },
          },
        },
        MenuItemRequest: {
          type: 'object',
          required: ['name', 'category', 'variants', 'foodType'],
          properties: {
            name: { type: 'string', example: 'Chicken Dum Biryani' },
            category: { type: 'string', example: '64f2a1b2c3d4e5f6a7b8c9d0' },
            foodType: { type: 'string', enum: ['Veg', 'Non-Veg'], example: 'Non-Veg' },
            description: { type: 'string' },
            servingSize: { type: 'string' },
            ingredients: { type: 'array', items: { type: 'string' } },
            variants: { type: 'array', items: { $ref: '#/components/schemas/MenuVariant' } },
            status: { type: 'string', enum: ['Active', 'Inactive'] },
            isDraft: { type: 'boolean' },
            foodImageUrl: { type: 'string' },
            nutrition: { type: 'object' },
            nutritionStatus: { type: 'string', enum: ['Approved', 'Pending'] },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        CategoryListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
          },
        },
        MenuItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            category: {
              type: 'object',
              properties: { id: { type: 'string' }, name: { type: 'string' } },
            },
            foodType: { type: 'string', enum: ['Veg', 'Non-Veg'] },
            description: { type: 'string', nullable: true },
            servingSize: { type: 'string', nullable: true },
            ingredients: { type: 'array', items: { type: 'string' } },
            variants: { type: 'array', items: { $ref: '#/components/schemas/MenuVariant' } },
            status: { type: 'string', enum: ['Active', 'Inactive'] },
            isDraft: { type: 'boolean' },
            foodImageUrl: { type: 'string', nullable: true },
            nutrition: { type: 'object', nullable: true },
            nutritionStatus: { type: 'string', enum: ['Approved', 'Pending'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MenuItemListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/MenuItem' } },
            pagination: { $ref: '#/components/schemas/Pagination' },
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
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/MenuItemRequest' } },
            },
          },
          responses: {
            201: { description: 'Menu item created' },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
          },
        },
        get: {
          summary: 'List menu items (admin + customer)',
          tags: ['Menu'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['Active', 'Inactive'] } },
            { in: 'query', name: 'isDraft', schema: { type: 'string', enum: ['true', 'false'] } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Paginated menu item list',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/MenuItemListResponse' } },
              },
            },
            401: { description: 'Authentication required' },
          },
        },
      },
      [`${api}/menu/{id}`]: {
        get: {
          summary: 'Get a menu item by id (admin + customer)',
          tags: ['Menu'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Menu item' },
            401: { description: 'Authentication required' },
            404: { description: 'Menu item not found' },
          },
        },
        patch: {
          summary: 'Update menu item (admin only)',
          tags: ['Menu'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/MenuItemRequest' } },
            },
          },
          responses: {
            200: { description: 'Menu item updated' },
            400: { description: 'Validation error' },
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
            404: { description: 'Menu item not found' },
          },
        },
        delete: {
          summary: 'Delete menu item (admin only)',
          tags: ['Menu'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Menu item deleted' },
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
            404: { description: 'Menu item not found' },
          },
        },
      },
      [`${api}/menu/{id}/image`]: {
        post: {
          summary: 'Upload/replace food image (admin only)',
          tags: ['Menu'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Food image uploaded' },
            400: { description: 'Validation error' },
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
            404: { description: 'Menu item not found' },
          },
        },
      },
      [`${api}/categories`]: {
        get: {
          summary: 'List menu categories (admin + customer)',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 100 } },
          ],
          responses: {
            200: {
              description: 'List of categories',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/CategoryListResponse' } },
              },
            },
            401: { description: 'Authentication required' },
          },
        },
        post: {
          summary: 'Create a menu category (admin only)',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: { name: { type: 'string', example: 'Rice & Biryani' } },
                },
              },
            },
          },
          responses: {
            201: { description: 'Category created' },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
            401: { description: 'Authentication required' },
            403: { description: 'Access denied' },
            409: { description: 'Category already exists' },
          },
        },
      },
      [`${api}/categories/{id}`]: {
        get: {
          summary: 'Get a category by id (admin + customer)',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Category',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Category' },
                    },
                  },
                },
              },
            },
            401: { description: 'Authentication required' },
            404: { description: 'Category not found' },
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