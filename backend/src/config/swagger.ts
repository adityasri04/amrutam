export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Amrutam API',
      version: '1.0.0',
      description: 'API documentation for Amrutam Ayurvedic Doctor Consultation Platform',
      contact: {
        name: 'Amrutam Team',
        email: 'support@amrutam.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts']
};
