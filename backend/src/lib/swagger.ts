import swaggerJSDoc from 'swagger-jsdoc';
import { SETTINGS } from './settings.js';

// OpenAPI spec assembled from JSDoc @openapi annotations on each module's
// *.routes.ts file (docs live next to the routes — component-based). New
// modules are picked up automatically by the `apis` glob below.
export const openapiSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'AssetFlow API',
      version: '0.1.0',
      description:
        'Enterprise Asset & Resource Management System — REST API. Authorize with a Bearer token from POST /auth/login.',
    },
    servers: [{ url: `http://localhost:${SETTINGS.port}/api`, description: 'Local' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'BAD_REQUEST' },
                message: { type: 'string' },
                details: {},
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'],
            },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            departmentId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & session' },
      { name: 'Organization', description: 'Departments, categories & employee directory (Admin setup)' },
    ],
  },
  // dev runs via tsx from the backend/ dir; picks up every module's routes.
  apis: ['./src/modules/**/*.routes.ts'],
});
