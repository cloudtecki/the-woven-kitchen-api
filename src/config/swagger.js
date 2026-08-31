'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const { config } = require('./index');

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
          },
        },
      },
    },
    paths: {
      '/api/health': {
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
    },
  },
  apis: ['./src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
